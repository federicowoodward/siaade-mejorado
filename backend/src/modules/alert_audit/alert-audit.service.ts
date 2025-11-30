import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UiAlertAudit } from "@/entities/audit/ui-alert-audit.entity";
import { normalizePagination } from "@/shared/utils/pagination";
import { CreateAlertAuditDto } from "./dto/create-alert-audit.dto";
import {
  AlertAuditBufferService,
  AlertAuditEvent,
} from "./alert-audit-buffer.service";

export type AlertAuditListItem = {
  id: number;
  userId: string | null;
  userEmail: string | null;
  severity: string;
  message: string;
  frontRoute: string | null;
  frontModule: string | null;
  action: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

@Injectable()
export class AlertAuditService {
  constructor(
    @InjectRepository(UiAlertAudit)
    private readonly repo: Repository<UiAlertAudit>,
    private readonly buffer: AlertAuditBufferService,
  ) {}

  async recordAlert(dto: CreateAlertAuditDto, userId?: string): Promise<void> {
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    const event: AlertAuditEvent = {
      message: dto.message,
      severity: dto.severity,
      timestamp,
      userId,
      frontRoute: dto.frontRoute,
      frontModule: dto.frontModule,
      action: dto.action,
      metadata: dto.metadata,
    };

    await this.buffer.enqueue(event);
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<{
    data: AlertAuditListItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Aceptar valores string/number desde los query params y sanear NaN
    const parsedPage =
      page !== undefined && page !== null ? Number(page) : undefined;
    const parsedLimit =
      limit !== undefined && limit !== null ? Number(limit) : undefined;

    const {
      page: p,
      limit: l,
      offset,
    } = normalizePagination(
      {
        page: Number.isNaN(parsedPage) ? undefined : parsedPage,
        limit: Number.isNaN(parsedLimit) ? undefined : parsedLimit,
      },
      { page: 1, limit: 50 },
    );

    const [rows, total] = await this.repo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.user", "u")
      .orderBy("a.createdAt", "DESC")
      .skip(offset)
      .take(l)
      .getManyAndCount();

    const data: AlertAuditListItem[] = rows.map((row) => {
      const safeMetadata =
        row.metadata && typeof row.metadata === "object"
          ? // Clonar a un objeto plano serializable
            JSON.parse(JSON.stringify(row.metadata))
          : null;

      return {
        id: row.id,
        userId: row.userId,
        userEmail: row.user?.email ?? null,
        severity: row.severity,
        message: row.message,
        frontRoute: row.frontRoute,
        frontModule: row.frontModule,
        action: row.action,
        metadata: safeMetadata,
        createdAt: row.createdAt,
      };
    });

    return { data, total, page: p, limit: l };
  }
}
