import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@/entities/users/user.entity";
import { Student } from "@/entities/users/student.entity";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";
import { Notice } from "@/entities/notices/notice.entity";
import { CatalogsService } from "@/modules/catalogs/catalogs.service";
import { ROLE_IDS } from "@/shared/rbac/roles.constants";
import { FinalExam } from "@/entities/finals/final-exam.entity";

@Injectable()
export class StudentsReadService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(FinalExamsStudent)
    private readonly fesRepo: Repository<FinalExamsStudent>,
    @InjectRepository(Notice) private readonly noticeRepo: Repository<Notice>,
    @InjectRepository(FinalExam)
    private readonly finalExamRepo: Repository<FinalExam>,
    private readonly catalogsService: CatalogsService,
  ) {}

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
    const status =
      await this.catalogsService.getStudentAcademicStatus(studentId);
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

  async getStudentSummary(studentId: string) {
    const student = await this.studentRepo.findOne({
      where: { userId: studentId },
      relations: ["user", "commission"],
    });
    if (!student) throw new NotFoundException("Estudiante no encontrado");

    const { user } = student;

    // Obtener situación académica para construir los años
    const academicStatus =
      await this.catalogsService.getStudentAcademicStatus(studentId);

    // Construir estructura de años con materias
    const years = [];
    for (const [yearLabel, subjects] of Object.entries(academicStatus.byYear)) {
      const yearMatch = yearLabel.match(/\d+/);
      const yearNumber = yearMatch ? parseInt(yearMatch[0]) : 0;

      years.push({
        year: yearNumber,
        subjects: (subjects as any[]).map((s) => ({
          id: s.subjectId,
          name: s.subjectName,
          calendarYear: s.year,
          division: s.commissionLetter,
          finalCondition: s.condition,
          lastExamSummary: this.buildExamSummary(s),
          hasGrades: this.hasGrades(s),
        })),
      });
    }

    // Ordenar años
    years.sort((a, b) => a.year - b.year);

    return {
      id: studentId,
      studentId: studentId,
      firstName: user.name,
      lastName: user.lastName,
      fullName: `${user.name} ${user.lastName}`,
      documentNumber: user.cuil,
      legajo: student.legajo,
      studentStartYear: student.studentStartYear,
      careerPlanName: null,
      planName: null,
      registeredSince: student.studentStartYear
        ? `${student.studentStartYear}-01-01`
        : null,
      currentAcademicYear: years.length > 0 ? Math.max(...years.map((y) => y.year)) : null,
      years,
    };
  }

  private buildExamSummary(subject: any): string | null {
    const parts: string[] = [];
    const notes = [subject.note1, subject.note2, subject.note3, subject.note4].filter(
      (n) => typeof n === "number"
    );
    if (notes.length) parts.push(`Parciales: ${notes.join(", ")}`);
    if (typeof subject.final === "number") parts.push(`Final: ${subject.final}`);
    if (typeof subject.attendancePercentage === "number")
      parts.push(`Asist.: ${subject.attendancePercentage}%`);
    if (subject.condition) parts.push(subject.condition);
    return parts.length > 0 ? parts.join(" • ") : null;
  }

  private hasGrades(subject: any): boolean {
    return (
      typeof subject.final === "number" ||
      typeof subject.note1 === "number" ||
      typeof subject.note2 === "number" ||
      typeof subject.note3 === "number" ||
      typeof subject.note4 === "number"
    );
  }

  async getActionContext(studentId: string) {
    // TODO: Implementar lógica real de ventanas y correlativas
    // Por ahora devolvemos estructura vacía para evitar 404 en frontend
    return {
      courseWindow: null,
      examWindow: null,
      correlatives: [],
      duplicates: [],
      quotaFull: [],
    };
  }
}
