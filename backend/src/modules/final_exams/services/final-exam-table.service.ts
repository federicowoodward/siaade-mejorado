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
      .createQueryBuilder('t')
      .leftJoin('users', 'u', 'u.id = t.created_by')
      .select([
        't.id AS id',
        't.name AS name',
        "to_char(t.start_date, 'YYYY-MM-DD') AS start_date",
        "to_char(t.end_date, 'YYYY-MM-DD') AS end_date",
        't.created_by AS created_by',
        'u.id AS created_by_user_id',
        'u.name AS created_by_user_name',
        'u.last_name AS created_by_user_last_name',
        'u.email AS created_by_user_email',
      ])
      .orderBy('t.start_date', 'DESC')
      .addOrderBy('t.id', 'DESC');

    if (id) qb.where('t.id = :id', { id });

    const rows = await qb.getRawMany();
    if (id && !rows.length) throw new NotFoundException('Exam table not found');

    const mapRow = (r: any) => ({
      id: r.id,
      name: r.name,
      start_date: r.start_date,
      end_date: r.end_date,
      created_by: r.created_by,
      createdByUser: r.created_by_user_id
        ? {
            id: r.created_by_user_id,
            name: r.created_by_user_name,
            last_name: r.created_by_user_last_name,
            email: r.created_by_user_email,
          }
        : undefined,
    });

    return id ? mapRow(rows[0]) : rows.map(mapRow);
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
    return this.tableRepo.save(row);
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
    const outOfRange = finals.find((f) => !dateInRange(f.examDate, nextStart, nextEnd));
    if (outOfRange) {
      throw new BadRequestException(
        "There are final exams outside the new date range",
      );
    }

    row.name = dto.name ?? row.name;
    row.startDate = nextStart;
    row.endDate = nextEnd;
    return this.tableRepo.save(row);
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
}

