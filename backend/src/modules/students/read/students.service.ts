import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@/entities/users/user.entity";
import { Student } from "@/entities/users/student.entity";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";
import { Notice } from "@/entities/notices/notice.entity";
import { CatalogsService } from "@/modules/catalogs/catalogs.service";
import { FinalExam } from "@/entities/finals/final-exam.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";

@Injectable()
export class StudentsReadService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(CareerStudent)
    private readonly careerStudentRepo: Repository<CareerStudent>,
    @InjectRepository(FinalExamsStudent)
    private readonly fesRepo: Repository<FinalExamsStudent>,
    @InjectRepository(Notice) private readonly noticeRepo: Repository<Notice>,
    @InjectRepository(FinalExam)
    private readonly finalExamRepo: Repository<FinalExam>,
    private readonly catalogsService: CatalogsService,
  ) {}

  async getStudentSummary(studentId: string) {
    if (!studentId)
      throw new NotFoundException("Id de estudiante no proporcionado");

    const student = await this.studentRepo.findOne({
      where: { userId: studentId },
      relations: ["user", "commission"],
    });
    if (!student) throw new NotFoundException("Estudiante no encontrado");

    let careerEnrollment: CareerStudent | null = null;
    let academicStatus: { byYear: Record<string, AcademicStatusRow[]> } = {
      byYear: {},
    };

    try {
      [careerEnrollment, academicStatus] = await Promise.all([
        this.careerStudentRepo.findOne({
          where: { studentId },
          relations: { career: { academicPeriod: true } },
          order: { enrolledAt: "DESC", id: "DESC" },
        }),
        this.catalogsService.getStudentAcademicStatus(studentId),
      ]);
    } catch (error) {
      // En caso de falla, devolvemos lo que tengamos para no romper el summary.
      // eslint-disable-next-line no-console
      console.warn("[StudentsRead] getStudentSummary fallback", {
        error,
        studentId,
      });
    }

    const byYear = academicStatus?.byYear ?? {};
    const years = this.mapAcademicStatusToYears(byYear);
    const currentAcademicYear = this.resolveCurrentAcademicYear(years, byYear);

    const registeredSince =
      careerEnrollment?.enrolledAt ??
      (student.studentStartYear
        ? new Date(Date.UTC(student.studentStartYear, 0, 1))
        : null);

    return {
      id: student.userId,
      studentId: student.userId,
      firstName: student.user?.name ?? null,
      lastName: student.user?.lastName ?? null,
      fullName: this.buildFullName(student.user?.name, student.user?.lastName),
      documentType: null,
      documentNumber: student.user?.cuil ?? null,
      legajo: student.legajo,
      studentStartYear: student.studentStartYear,
      careerPlanName: careerEnrollment?.career?.careerName ?? null,
      planName: careerEnrollment?.career?.careerName ?? null,
      registeredSince,
      currentAcademicYear,
      years,
    };
  }

  async getStudentFullData(studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { userId: studentId },
      relations: ["user", "commission"],
    });
    if (!student) throw new NotFoundException("Estudiante no encontrado");

    const { user } = student;

    // Situación académica completa (por año)
    const academicStatus =
      await this.catalogsService.getStudentAcademicStatus(studentId);

    // Finales del alumno (con detalle básico)
    const finals = await this.fesRepo.find({
      where: { studentId },
      relations: ["finalExam", "finalExam.subject", "status"],
      order: { id: "DESC" },
    });
    const finalsData = finals.map((row) => ({
      id: row.id,
      finalExamId: row.finalExamId,
      subjectId: row.finalExam?.subjectId ?? null,
      subjectName: row.finalExam?.subject?.subjectName ?? null,
      examDate: row.finalExam?.examDate ?? null,
      score: row.score ? Number(row.score) : null,
      statusId: row.statusId,
      statusName: row.status?.name ?? null,
      enrolledAt: row.enrolledAt ?? null,
      approvedAt: row.approvedAt ?? null,
    }));

    // Avisos visibles para el rol del usuario (o globales)
    const roleId = user.roleId;
    // build query manual para permitir visibleRoleId IS NULL OR = roleId
    const notices = await this.noticeRepo
      .createQueryBuilder("n")
      .where("n.visible_role_id IS NULL OR n.visible_role_id = :rid", {
        rid: roleId,
      })
      .orderBy("n.created_at", "DESC")
      .limit(10)
      .getMany();
    const noticesData = notices.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      visibleRoleId: n.visibleRoleId,
      createdAt: n.createdAt,
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        roleId: user.roleId,
        isBlocked: user.isBlocked,
        blockedReason: user.blockedReason,
        isActive: user.isActive,
      },
      student: {
        userId: student.userId,
        legajo: student.legajo,
        commissionId: student.commissionId,
        commissionLetter: student.commission?.commissionLetter ?? null,
        canLogin: student.canLogin,
        isActive: student.isActive,
        studentStartYear: student.studentStartYear,
      },
      academicStatus,
      finals: finalsData,
      notices: noticesData,
    };
  }

  async getSubjectsStatusFlat(studentId: string): Promise<
    Array<{
      subjectId: number;
      subjectName: string;
      year: number | null;
      commissionId: number;
      commissionLetter: string | null;
      condition: string | null;
    }>
  > {
    let status: { byYear: Record<string, AcademicStatusRow[]> };
    try {
      status = await this.catalogsService.getStudentAcademicStatus(studentId);
    } catch (error) {
      // Evitar 500 si falla el origen de datos: devolvemos vacío y logueamos.
      // eslint-disable-next-line no-console
      console.warn("[StudentsRead] getSubjectsStatusFlat fallback vacío", {
        studentId,
        error,
      });
      return [];
    }
    const flat: Array<{
      subjectId: number;
      subjectName: string;
      year: number | null;
      commissionId: number;
      commissionLetter: string | null;
      condition: string | null;
    }> = [];
    for (const arr of Object.values(status.byYear)) {
      for (const s of arr) {
        flat.push({
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          year: s.year,
          commissionId: s.commissionId,
          commissionLetter: s.commissionLetter,
          condition: s.condition,
        });
      }
    }
    // Orden: primero por año (asc, null al final), luego por nombre
    flat.sort((a, b) => {
      const ay = a.year ?? 9999;
      const by = b.year ?? 9999;
      if (ay !== by) return ay - by;
      return a.subjectName.localeCompare(b.subjectName);
    });
    return flat;
  }

  // Compat: contexto de acciones (ventanas/correlativas). Por ahora devolvemos estructura vacía.
  getActionContext(_studentId: string): {
    courseWindow: any;
    examWindow: any;
    correlatives: Array<{ subjectId: number; ok: boolean }>;
    duplicates: number[];
    quotaFull: number[];
    quotaBlockedSubjects: number[];
  } {
    return {
      courseWindow: null,
      examWindow: null,
      correlatives: [],
      duplicates: [],
      quotaFull: [],
      quotaBlockedSubjects: [],
    };
  }

  private mapAcademicStatusToYears(
    byYear: Record<string, AcademicStatusRow[]>,
  ): Array<{
    year: number;
    subjects: Array<{
      id: number | null;
      name: string;
      calendarYear: number | null;
      division: string | null;
      finalCondition: string | null;
      lastExamSummary: string | null;
      hasGrades: boolean;
    }>;
  }> {
    const result: Array<{
      year: number;
      subjects: Array<{
        id: number | null;
        name: string;
        calendarYear: number | null;
        division: string | null;
        finalCondition: string | null;
        lastExamSummary: string | null;
        hasGrades: boolean;
      }>;
    }> = [];

    for (const [label, rows] of Object.entries(byYear ?? {})) {
      const yearNumber = this.resolveYearNumber(label, rows);
      const subjects = rows
        .map((row) => ({
          id: row.subjectId ?? null,
          name: row.subjectName ?? "Materia",
          calendarYear: row.year ?? (yearNumber > 0 ? yearNumber : null),
          division: row.commissionLetter ?? null,
          finalCondition: row.condition ?? null,
          lastExamSummary: this.buildLastExamSummary(row),
          hasGrades: this.hasGrades(row),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      result.push({ year: yearNumber, subjects });
    }

    result.sort((a, b) => a.year - b.year);
    return result;
  }

  private resolveYearNumber(label: string, rows: AcademicStatusRow[]): number {
    const explicitYear = rows.find(
      (r) =>
        typeof r.year === "number" && Number.isFinite(r.year) && r.year > 0,
    )?.year;
    if (explicitYear) return explicitYear;
    const match = label?.match(/\d+/);
    if (match?.[0]) {
      const parsed = Number(match[0]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return 0;
  }

  private buildLastExamSummary(row: AcademicStatusRow): string | null {
    const parts: string[] = [];
    const notes = [row.note1, row.note2, row.note3, row.note4].filter(
      (n): n is number => typeof n === "number",
    );
    if (notes.length) {
      parts.push(`Parciales: ${notes.join(", ")}`);
    }
    if (typeof row.final === "number") {
      parts.push(`Final: ${row.final}`);
    }
    const attendance = Number(row.attendancePercentage ?? 0);
    if (!Number.isNaN(attendance) && attendance > 0) {
      parts.push(`Asist.: ${attendance}%`);
    }
    if (row.condition) {
      parts.push(row.condition);
    }
    if (!parts.length) return null;
    return parts.join(" | ");
  }

  private hasGrades(row: AcademicStatusRow): boolean {
    const hasNote = [
      row.note1,
      row.note2,
      row.note3,
      row.note4,
      row.final,
    ].some((n) => typeof n === "number");
    const hasCondition =
      typeof row.condition === "string" && row.condition.trim().length > 0;
    return hasNote || hasCondition;
  }

  private resolveCurrentAcademicYear(
    years: Array<{ year: number; subjects: unknown[] }>,
    byYear: Record<string, AcademicStatusRow[]>,
  ): number | null {
    const numericYears = years
      .map((y) => y.year)
      .filter(
        (y): y is number => y != null && Number.isFinite(y) && y > 0,
      ) as number[];
    if (numericYears.length) return Math.max(...numericYears);

    // Fallbacks: intentar leer a��o desde las claves o las filas
    const parsedFromKeys = Object.keys(byYear ?? {})
      .map((label) => this.parseYearFromLabel(label))
      .filter((y): y is number => y != null && Number.isFinite(y) && y > 0);
    if (parsedFromKeys.length) return Math.max(...parsedFromKeys);

    const parsedFromRows: number[] = [];
    Object.values(byYear ?? {}).forEach((rows) => {
      rows.forEach((row) => {
        const candidate = Number(row.year ?? 0);
        if (Number.isFinite(candidate) && candidate > 0) {
          parsedFromRows.push(candidate);
        }
      });
    });
    if (parsedFromRows.length) return Math.max(...parsedFromRows);

    return null;
  }

  private buildFullName(
    firstName: string | null | undefined,
    lastName: string | null | undefined,
  ): string | null {
    const parts = [firstName, lastName]
      .map((value) => (value ?? "").trim())
      .filter((value) => value.length > 0);
    if (parts.length) return parts.join(" ");
    return null;
  }

  private parseYearFromLabel(label: string | null | undefined): number | null {
    if (!label) return null;
    const match = label.match(/\d+/);
    if (!match?.[0]) return null;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}

type AcademicStatusRow = {
  subjectId: number;
  subjectName: string;
  year: number | null;
  commissionId: number;
  commissionLetter: string | null;
  partials: 2 | 4;
  note1: number | null;
  note2: number | null;
  note3: number | null;
  note4: number | null;
  final: number | null;
  attendancePercentage: number;
  condition: string | null;
};
