// src/modules/final_exams/services/final-exam-table.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExamTable } from "@/entities/finals/exam-table.entity";

import {
  InitFinalExamTableDto,
  EditFinalExamTableDto,
} from "../dto/final-exam-table.dto";
import { isoToDate, dateInRange } from "../utils/date-utils";
import { hasRankAtLeast } from "../utils/rbac-utils";
import { ROLE } from "@/shared/rbac/roles.constants";
import { FinalExam } from "@/entities/finals/final-exam.entity";

@Injectable()
export class FinalExamTableService {
  constructor(
    @InjectRepository(ExamTable)
    private tableRepo: Repository<ExamTable>,
    @InjectRepository(FinalExam) private finalRepo: Repository<FinalExam>,
  ) {}

  async list(id?: number) {
    const qb = this.tableRepo
      .createQueryBuilder("t")
      .leftJoin("users", "u", "u.id = t.created_by")
      .select([
        "t.id AS id",
        "t.name AS name",
        "to_char(t.start_date, 'YYYY-MM-DD') AS start_date",
        "to_char(t.end_date, 'YYYY-MM-DD') AS end_date",
        "t.created_by AS created_by",
        "u.id AS created_by_user_id",
        "u.name AS created_by_user_name",
        "u.last_name AS created_by_user_last_name",
        "u.email AS created_by_user_email",
      ])
      .orderBy("t.start_date", "DESC")
      .addOrderBy("t.id", "DESC");

    if (id) qb.where("t.id = :id", { id });

    const rows = await qb.getRawMany();
    if (id && !rows.length) throw new NotFoundException("Exam table not found");

    const mapped = rows.map((r) => this.mapRawRow(r));
    return id ? mapped[0] : mapped;
  }

  async init(dto: InitFinalExamTableDto) {
    const start = isoToDate(dto.start_date);
    const end = isoToDate(dto.end_date);
    if (start > end) {
      throw new BadRequestException("start_date must be <= end_date");
    }

    const row = this.tableRepo.create({
      name: dto.name,
      startDate: start,
      endDate: end,
      createdBy: dto.created_by ?? null,
    });
    const saved = await this.tableRepo.save(row);
    return this.mapEntity(saved);
  }

  async edit(id: number, dto: EditFinalExamTableDto) {
    const row = await this.tableRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException("Exam table not found");

    const nextStart = dto.start_date ? isoToDate(dto.start_date) : row.startDate;
    const nextEnd = dto.end_date ? isoToDate(dto.end_date) : row.endDate;
    if (nextStart > nextEnd) {
      throw new BadRequestException("start_date must be <= end_date");
    }

    const finals = await this.finalRepo.find({ where: { examTableId: id } });
    const outOfRange = finals.find((f) =>
      !dateInRange(f.examDate, nextStart, nextEnd)
    );
    if (outOfRange) {
      throw new BadRequestException(
        "There are final exams outside the new date range",
      );
    }

    row.name = dto.name ?? row.name;
    row.startDate = nextStart;
    row.endDate = nextEnd;
    const saved = await this.tableRepo.save(row);
    return this.mapEntity(saved);
  }

  /**
   * Regla: si la mesa es "vieja" (+2 meses), PRECEPTOR no puede borrar (SECRETARIO/ADMIN s�).
   */
  async remove(id: number, requesterRole: ROLE) {
    const row = await this.tableRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException("Exam table not found");

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    if (row.endDate < twoMonthsAgo && !hasRankAtLeast(requesterRole, ROLE.SECRETARY)) {
      throw new ForbiddenException(
        "Insufficient hierarchy to delete old exam tables",
      );
    }

    await this.tableRepo.remove(row);
    return { deleted: true };
  }

  private mapRawRow(row: any) {
    const creator = row.created_by_user_id
      ? {
          id: row.created_by_user_id,
          name: row.created_by_user_name,
          last_name: row.created_by_user_last_name,
          lastName: row.created_by_user_last_name,
          email: row.created_by_user_email,
        }
      : undefined;

    return this.composeResponse({
      id: Number(row.id),
      name: row.name,
      start: row.start_date,
      end: row.end_date,
      createdBy: row.created_by ?? null,
      createdByUser: creator,
    });
  }

  private mapEntity(entity: ExamTable) {
    const creator = entity.createdByUser
      ? {
          id: entity.createdByUser.id,
          name: entity.createdByUser.name,
          last_name: entity.createdByUser.lastName,
          lastName: entity.createdByUser.lastName,
          email: entity.createdByUser.email,
        }
      : undefined;

    return this.composeResponse({
      id: entity.id,
      name: entity.name,
      start: entity.startDate,
      end: entity.endDate,
      createdBy: entity.createdBy ?? null,
      createdByUser: creator,
    });
  }

  private composeResponse(input: {
    id: number;
    name: string;
    start: Date | string | null;
    end: Date | string | null;
    createdBy: string | null;
    createdByUser?:
      | {
          id: string;
          name?: string;
          last_name?: string | null;
          lastName?: string | null;
          email?: string | null;
        }
      | undefined;
  }) {
    const startIso = this.toIsoDate(input.start);
    const endIso = this.toIsoDate(input.end);
    const windowState = this.resolveWindowState(startIso, endIso);
    return {
      id: input.id,
      name: input.name,
      start_date: startIso,
      startDate: startIso,
      end_date: endIso,
      endDate: endIso,
      window_state: windowState,
      windowState,
      window: {
        label: input.name,
        opensAt: startIso,
        closesAt: endIso,
        state: windowState,
        message: null,
      },
      visibility: {
        students: true,
        staff: true,
      },
      quota: {
        max: null,
        used: null,
      },
      created_by: input.createdBy,
      createdBy: input.createdBy,
      createdByUser: input.createdByUser
        ? {
            id: input.createdByUser.id,
            name: input.createdByUser.name ?? null,
            last_name: input.createdByUser.last_name ?? input.createdByUser.lastName ?? null,
            lastName: input.createdByUser.last_name ?? input.createdByUser.lastName ?? null,
            email: input.createdByUser.email ?? null,
          }
        : undefined,
    };
  }

  private toIsoDate(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === "string" && value.length >= 10) {
      return value.includes("T") ? value.slice(0, 10) : value;
    }
    return null;
  }

  private resolveWindowState(
    start?: string | null,
    end?: string | null,
  ): "open" | "upcoming" | "past" | "closed" {
    if (!start || !end) return "closed";
    const from = Date.parse(start);
    const to = Date.parse(end);
    if (Number.isNaN(from) || Number.isNaN(to)) return "closed";
    const now = Date.now();
    if (now < from) return "upcoming";
    if (now > to) return "past";
    return "open";
  }
}

