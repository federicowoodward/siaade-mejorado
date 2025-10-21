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
import { FinalExam } from "@/entities/finals/final-exam.entity";

@Injectable()
export class FinalExamTableService {
  constructor(
    @InjectRepository(ExamTable)
    private tableRepo: Repository<ExamTable>,
    @InjectRepository(FinalExam) private finalRepo: Repository<FinalExam>,
  ) {}

  async list(id?: number) {
    if (id) {
      const row = await this.tableRepo.findOne({ where: { id } });
      if (!row) throw new NotFoundException("Exam table not found");
      return row;
    }

    return this.tableRepo.find({
      order: { startDate: "DESC", id: "DESC" },
    });
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
   * Regla: si la mesa es "vieja" (+2 meses), PRECEPTOR no puede borrar (SECRETARIO/ADMIN sí).
   */
  async remove(id: number, requesterRole: string) {
    const row = await this.tableRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException("Exam table not found");

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    if (row.endDate < twoMonthsAgo && !hasRankAtLeast(requesterRole, "SECRETARIO")) {
      throw new ForbiddenException(
        "Insufficient hierarchy to delete old exam tables",
      );
    }

    await this.tableRepo.remove(row);
    return { deleted: true };
  }
}

