import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, SelectQueryBuilder } from "typeorm";
import { FinalExam } from "@/entities/finals/final-exam.entity";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";
import { ExamTable } from "@/entities/finals/exam-table.entity";
import {
  StudentEnrollmentResponseDto,
  StudentExamCallDto,
  StudentExamTableDto,
  StudentExamWindowDto,
  StudentWindowState,
} from "./dto/student-exam.dto";
import {
  ExamTableFiltersDto,
  WindowFilter,
} from "./dto/exam-table-filters.dto";
import { AuditEventDto } from "./dto/audit-event.dto";

type NormalizedFilters = {
  subjectId?: number;
  from?: Date;
  to?: Date;
  windowState: WindowFilter;
};

@Injectable()
export class StudentInscriptionsService {
  constructor(
    @InjectRepository(FinalExam)
    private readonly finalRepo: Repository<FinalExam>,
    @InjectRepository(FinalExamsStudent)
    private readonly linkRepo: Repository<FinalExamsStudent>,
  ) {}

  async listExamTables(
    studentId: string,
    filters: ExamTableFiltersDto,
  ): Promise<StudentExamTableDto[]> {
    const normalized = this.normalizeFilters(filters);
    const finals = await this.buildFinalsQuery(normalized).getMany();

    if (!finals.length) {
      return [];
    }

    const finalIds = finals.map((fe) => fe.id);
    const [quotaMap, enrollmentLinks] = await Promise.all([
      this.buildQuotaMap(finalIds),
      this.fetchEnrollments(studentId, finalIds),
    ]);

    const grouped = new Map<string, StudentExamTableDto>();

    for (const finalExam of finals) {
      const table = finalExam.examTable;
      const subject = finalExam.subject;
      if (!table || !subject) {
        continue;
      }

      const window = this.buildWindow(table);
      if (
        normalized.windowState !== "all" &&
        window.state !== normalized.windowState
      ) {
        continue;
      }

      const key = `${table.id}:${subject.id}`;
      const entry =
        grouped.get(key) ??
        this.createTableEntry(
          grouped,
          key,
          table.id,
          subject.id,
          subject.subjectName,
        );

      const call = this.buildCall(
        finalExam,
        table.name ?? "Llamado",
        window,
        quotaMap.get(finalExam.id) ?? null,
      );

      const enrollment = enrollmentLinks.get(finalExam.id);
      if (enrollment?.enrolledAt) {
        entry.duplicateEnrollment = true;
      }

      entry.availableCalls.push(call);
    }

    return Array.from(grouped.values())
      .map((tableDto) => ({
        ...tableDto,
        availableCalls: tableDto.availableCalls.sort((a, b) =>
          a.examDate.localeCompare(b.examDate),
        ),
      }))
      .filter((tableDto) => tableDto.availableCalls.length > 0);
  }

  async enroll(
    studentId: string,
    mesaId: number,
    finalExamId: number,
  ): Promise<StudentEnrollmentResponseDto> {
    let link = await this.linkRepo.findOne({
      where: { studentId, finalExamId },
      relations: {
        finalExam: { examTable: true },
      },
    });

    if (!link) {
      const finalExam = await this.finalRepo.findOne({
        where: { id: finalExamId },
        relations: { examTable: true },
      });
      if (!finalExam || !finalExam.examTable) {
        return this.blocked(
          "UNKNOWN",
          "No encontramos la mesa solicitada. Verifica la informacion e intenta nuevamente.",
        );
      }
      if (finalExam.examTableId !== mesaId) {
        return this.blocked(
          "UNKNOWN",
          "La mesa seleccionada no coincide con el llamado solicitado.",
        );
      }
      link = this.linkRepo.create({
        finalExamId,
        finalExam,
        studentId,
        enrolledAt: null,
        score: null as any,
        notes: "",
      });
    }

    if (!link.finalExam || !link.finalExam.examTable) {
      return this.blocked(
        "UNKNOWN",
        "No encontramos la mesa solicitada. Verifica la informacion e intenta nuevamente.",
      );
    }

    if (link.finalExam.examTableId !== mesaId) {
      return this.blocked(
        "UNKNOWN",
        "La mesa seleccionada no coincide con el llamado solicitado.",
      );
    }

    const window = this.buildWindow(link.finalExam.examTable);
    if (window.state !== "open") {
      const detail = window.closesAt
        ? `El periodo estuvo disponible hasta ${
            this.formatDisplayDate(window.closesAt) ?? window.closesAt
          }.`
        : "La mesa no tiene una ventana de inscripcion activa.";
      return this.blocked("WINDOW_CLOSED", detail);
    }

    if (link.enrolledAt) {
      return this.blocked(
        "DUPLICATE",
        "Ya contas con una inscripcion vigente para este llamado.",
      );
    }

    link.enrolledAt = new Date();
    await this.linkRepo.save(link);

    return {
      ok: true,
      blocked: false,
      reasonCode: null,
      message: "Inscripcion registrada correctamente.",
      refreshRequired: true,
    };
  }

  audit(payload: AuditEventDto, userId: string | null): void {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info("[StudentInscriptions][Audit]", {
        ...payload,
        userId,
        at: new Date().toISOString(),
      });
    }
  }

  private buildFinalsQuery(
    filters: NormalizedFilters,
  ): SelectQueryBuilder<FinalExam> {
    const qb = this.finalRepo
      .createQueryBuilder("fe")
      .leftJoinAndSelect("fe.examTable", "table")
      .leftJoinAndSelect("fe.subject", "subject")
      .orderBy("fe.examDate", "ASC")
      .addOrderBy("fe.id", "ASC");

    if (filters.subjectId) {
      qb.andWhere("fe.subjectId = :subjectId", {
        subjectId: filters.subjectId,
      });
    }
    if (filters.from) {
      qb.andWhere("fe.examDate >= :fromDate", {
        fromDate: filters.from.toISOString(),
      });
    }
    if (filters.to) {
      qb.andWhere("fe.examDate <= :toDate", {
        toDate: filters.to.toISOString(),
      });
    }

    return qb;
  }

  private normalizeFilters(filters: ExamTableFiltersDto): NormalizedFilters {
    const subjectId =
      typeof filters.subjectId === "number" &&
      Number.isFinite(filters.subjectId)
        ? filters.subjectId
        : undefined;

    return {
      subjectId,
      from: filters.from ? this.edgeDate(filters.from, "start") : undefined,
      to: filters.to ? this.edgeDate(filters.to, "end") : undefined,
      windowState: filters.windowState ?? "all",
    };
  }

  private edgeDate(value: string, mode: "start" | "end"): Date | undefined {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    if (mode === "start") {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    return date;
  }

  private async buildQuotaMap(
    finalExamIds: number[],
  ): Promise<Map<number, number | null>> {
    const unique = Array.from(new Set(finalExamIds));
    if (!unique.length) {
      return new Map();
    }

    const rows = await this.linkRepo
      .createQueryBuilder("fes")
      .select("fes.finalExamId", "finalExamId")
      .addSelect(
        "SUM(CASE WHEN fes.enrolledAt IS NOT NULL THEN 1 ELSE 0 END)",
        "enrolled",
      )
      .where("fes.finalExamId IN (:...ids)", { ids: unique })
      .groupBy("fes.finalExamId")
      .getRawMany();

    const map = new Map<number, number>();
    for (const row of rows) {
      map.set(Number(row.finalExamId), Number(row.enrolled ?? 0));
    }
    return map;
  }

  private async fetchEnrollments(
    studentId: string,
    finalExamIds: number[],
  ): Promise<Map<number, FinalExamsStudent>> {
    if (!finalExamIds.length) {
      return new Map();
    }
    const links = await this.linkRepo.find({
      where: {
        studentId,
        finalExamId: In(finalExamIds),
      },
    });
    return new Map(links.map((link) => [link.finalExamId, link]));
  }

  private createTableEntry(
    store: Map<string, StudentExamTableDto>,
    key: string,
    tableId: number,
    subjectId: number,
    subjectName: string,
  ): StudentExamTableDto {
    const entry: StudentExamTableDto = {
      mesaId: tableId,
      subjectId,
      subjectName: subjectName || "Materia sin nombre",
      subjectCode: null,
      commissionLabel: null,
      availableCalls: [],
      duplicateEnrollment: false,
      blockedReason: null,
      blockedMessage: null,
      academicRequirement: null,
    };
    store.set(key, entry);
    return entry;
  }

  private buildCall(
    finalExam: FinalExam,
    tableName: string,
    window: StudentExamWindowDto,
    quotaUsed: number | null,
  ): StudentExamCallDto {
    const examDate = this.formatDate(finalExam.examDate);
    return {
      id: finalExam.id,
      label: this.composeCallLabel(tableName, examDate),
      examDate,
      aula: finalExam.aula ?? null,
      quotaTotal: null,
      quotaUsed,
      enrollmentWindow: window,
      additional: false,
    };
  }

  private composeCallLabel(tableName: string, examDate: string): string {
    const display = this.formatDisplayDate(examDate);
    if (tableName && display) {
      return `${tableName} - ${display}`;
    }
    if (display) {
      return `Llamado ${display}`;
    }
    return tableName || "Llamado";
  }

  private formatDisplayDate(value: string | null): string | null {
    if (!value) {
      return null;
    }
    const parts = value.split("-");
    if (parts.length < 3) {
      return null;
    }
    return `${parts[2]}/${parts[1]}`;
  }

  private formatDate(value: Date | string | null | undefined): string {
    if (!value) {
      return "";
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toISOString().slice(0, 10);
  }

  private buildWindow(table: ExamTable): StudentExamWindowDto {
    const opensAt = this.formatDate(table.startDate);
    const closesAt = this.formatDate(table.endDate);
    return {
      id: table.id,
      label: table.name,
      opensAt: opensAt || null,
      closesAt: closesAt || null,
      state: this.resolveWindowState(opensAt, closesAt),
      message: null,
      isAdditional: false,
    };
  }

  private resolveWindowState(
    opensAt?: string | null,
    closesAt?: string | null,
  ): StudentWindowState {
    if (!opensAt || !closesAt) {
      return "closed";
    }
    const start = Date.parse(opensAt);
    const end = Date.parse(closesAt);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      return "closed";
    }
    const now = Date.now();
    if (now < start) {
      return "upcoming";
    }
    if (now > end) {
      return "past";
    }
    return "open";
  }

  private blocked(
    reasonCode: string,
    message: string,
  ): StudentEnrollmentResponseDto {
    return {
      ok: false,
      blocked: true,
      reasonCode,
      message,
      refreshRequired: false,
    };
  }
}
