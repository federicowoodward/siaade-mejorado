import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UiAlertAudit } from "@/entities/audit/ui-alert-audit.entity";

export type AlertAuditEvent = {
  message: string;
  severity: "info" | "warn" | "error" | "success";
  timestamp: Date;
  userId?: string;
  frontRoute?: string;
  frontModule?: string;
  action?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AlertAuditBufferService {
  private readonly logger = new Logger(AlertAuditBufferService.name);

  private readonly MAX_BUFFER_SIZE = 20;
  private readonly INACTIVITY_MS = 5 * 60 * 1000;
  private readonly MAX_TOTAL_ROWS = 200;
  private readonly PRUNE_BATCH_SIZE = 20;

  private buffer: AlertAuditEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor(
    @InjectRepository(UiAlertAudit)
    private readonly repo: Repository<UiAlertAudit>,
  ) {}

  async enqueue(event: AlertAuditEvent): Promise<void> {
    this.buffer.push(event);

    if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
      await this.flush("buffer-full");
      return;
    }

    this.resetInactivityTimer();
  }

  private resetInactivityTimer(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flushTimeout = setTimeout(() => {
      this.flush("inactivity").catch((error) => {
        this.logger.error("Error on inactivity flush", error as Error);
      });
    }, this.INACTIVITY_MS);
  }

  private async flush(reason: "buffer-full" | "inactivity"): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) {
      return;
    }

    this.isFlushing = true;
    this.logger.debug(
      `Flushing UI alert audit buffer due to '${reason}' with ${this.buffer.length} events`,
    );

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    const eventsToPersist = this.buffer;
    this.buffer = [];

    try {
      await this.persistEvents(eventsToPersist);
      await this.applyRetentionPolicy();
    } catch (error) {
      this.logger.error(
        "Failed to flush UI alert audit buffer; keeping recent events in memory",
        error as Error,
      );
      // Reinsert events (hasta el límite de buffer) para un intento futuro.
      const merged = [...eventsToPersist, ...this.buffer];
      this.buffer = merged.slice(-this.MAX_BUFFER_SIZE);
    } finally {
      this.isFlushing = false;
    }
  }

  private async persistEvents(events: AlertAuditEvent[]): Promise<void> {
    if (!events.length) return;

    const rows = events.map((evt) =>
      this.repo.create({
        userId: evt.userId ?? null,
        severity: evt.severity,
        message: evt.message,
        frontRoute: evt.frontRoute ?? null,
        frontModule: evt.frontModule ?? null,
        action: evt.action ?? null,
        metadata: evt.metadata ?? null,
        createdAt: evt.timestamp,
      }),
    );

    await this.repo.save(rows);
  }

  private async applyRetentionPolicy(): Promise<void> {
    const total = await this.repo.count();
    if (total <= this.MAX_TOTAL_ROWS) return;

    const toPrune = await this.repo
      .createQueryBuilder("a")
      .select(["a.id"])
      .orderBy("a.created_at", "ASC")
      .addOrderBy("a.id", "ASC")
      .limit(this.PRUNE_BATCH_SIZE)
      .getMany();

    const ids = toPrune.map((row) => row.id);
    if (ids.length === 0) return;

    await this.repo.delete(ids);
  }
}
