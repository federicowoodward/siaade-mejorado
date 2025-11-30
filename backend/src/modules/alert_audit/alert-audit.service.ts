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
    const {
      page: p,
      limit: l,
      offset,
    } = normalizePagination({ page, limit }, { page: 1, limit: 50 });

    const [rows, total] = await this.repo
      .createQueryBuilder("a")
      .orderBy("a.created_at", "DESC")
      .skip(offset)
      .take(l)
      .getManyAndCount();

    const data: AlertAuditListItem[] = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      severity: row.severity,
      message: row.message,
      frontRoute: row.frontRoute,
      frontModule: row.frontModule,
      action: row.action,
      metadata: row.metadata,
      createdAt: row.createdAt,
    }));

    return { data, total, page: p, limit: l };
  }
}
