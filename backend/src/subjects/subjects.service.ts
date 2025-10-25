import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import { StudentSubjectProgress } from "@/entities/subjects/student-subject-progress.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { SubjectStatusType } from "@/entities/catalogs/subject-status-type.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";
import { UpsertGradeDto } from "./dto/upsert-grade.dto";
import { PatchCellDto } from "./dto/patch-cell.dto";
import { GradeRowDto } from "./dto/grade-row.dto";
import { toCanonicalRole, CanonicalRole } from "@/shared/utils/roles.util";

type AuthenticatedUser = {
  id: string;
  role?: { name?: string };
  isDirective?: boolean;
};

type CommissionWithRole = {
  commission: Pick<SubjectCommission, "id" | "subjectId" | "teacherId">;
  role: CanonicalRole;
};

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(StudentSubjectProgress)
    private readonly progressRepo: Repository<StudentSubjectProgress>,
    @InjectRepository(SubjectCommission)
    private readonly subjectCommissionRepo: Repository<SubjectCommission>,
    @InjectRepository(SubjectStatusType)
    private readonly statusRepo: Repository<SubjectStatusType>,
    @InjectRepository(SubjectStudent)
    private readonly subjectStudentRepo: Repository<SubjectStudent>,
    private readonly dataSource: DataSource
  ) {}

  async getGrades(
    subjectCommissionId: number,
    user?: AuthenticatedUser
  ): Promise<GradeRowDto[]> {
    const { role } = await this.ensureAccess(subjectCommissionId, user, {
      allowStudent: true,
    });
    const rows = await this.fetchGradeRows(subjectCommissionId, undefined);
    if (role === "ALUMNO" && user?.id) {
      return rows.filter((row) => row.studentId === user.id);
    }
    return rows;
  }

  async patchCell(
    subjectCommissionId: number,
    studentId: string,
    dto: PatchCellDto,
    user?: AuthenticatedUser
  ): Promise<GradeRowDto> {
    const { commission } = await this.ensureAccess(
      subjectCommissionId,
      user,
      {
        allowStudent: false,
        targetStudentId: studentId,
      }
    );

    let progress = await this.progressRepo.findOne({
      where: { subjectCommissionId, studentId },
    });

    if (!progress) {
      await this.ensureStudentEnrollment(commission.subjectId, studentId);
      progress = this.progressRepo.create({
        subjectCommissionId,
        studentId,
        partialScores: {},
        attendancePercentage: "0",
        statusId: null,
      });
    }

    switch (dto.path) {
      case "partial1":
      case "partial2":
      case "final": {
        const key =
          dto.path === "partial1" ? "1" : dto.path === "partial2" ? "2" : "final";
        const value = this.normalizeScore(dto.value);
        const scores = { ...(progress.partialScores ?? {}) };
        if (value === null) {
          delete scores[key];
        } else {
          scores[key] = value;
        }
        progress.partialScores =
          Object.keys(scores).length > 0 ? scores : null;
        break;
      }
      case "attendance": {
        const attendance = this.normalizeAttendance(dto.value);
        progress.attendancePercentage = attendance.toFixed(2);
        break;
      }
      case "statusId": {
        const statusId = this.normalizeStatusId(dto.value);
        if (statusId !== null) {
          const exists = await this.statusRepo.exist({
            where: { id: statusId },
          });
          if (!exists) {
            throw new BadRequestException("statusId does not exist");
          }
        }
        progress.statusId = statusId;
        break;
      }
      default:
        throw new BadRequestException("Unsupported patch path");
    }

    await this.progressRepo.save(progress);
    const [row] = await this.fetchGradeRows(subjectCommissionId, [studentId]);
    if (!row) {
      throw new NotFoundException("Updated grade row not found");
    }
    return row;
  }

  async upsertGrades(
    subjectCommissionId: number,
    dto: UpsertGradeDto,
    user?: AuthenticatedUser
  ): Promise<{ updated: number }> {
    const { commission } = await this.ensureAccess(
      subjectCommissionId,
      user,
      { allowStudent: false }
    );

    const updated = await this.dataSource.transaction(async (manager) => {
      let count = 0;
      for (const row of dto.rows ?? []) {
        await this.upsertGradeRow(
          manager,
          commission,
          subjectCommissionId,
          row
        );
        count += 1;
      }
      return count;
    });

    return { updated };
  }

  async getSubjectStatuses(): Promise<Array<{ id: number; statusName: string }>> {
    const rows = await this.statusRepo.find({
      order: { id: "ASC" },
    });
    return rows.map(({ id, statusName }) => ({
      id,
      statusName,
    }));
  }

  private async ensureAccess(
    subjectCommissionId: number,
    user: AuthenticatedUser | undefined,
    options: { allowStudent: boolean; targetStudentId?: string } = {
      allowStudent: false,
    }
  ): Promise<CommissionWithRole> {
    const commission = await this.subjectCommissionRepo.findOne({
      where: { id: subjectCommissionId },
      select: ["id", "subjectId", "teacherId"],
    });

    if (!commission) {
      throw new NotFoundException(
        `Subject commission ${subjectCommissionId} was not found`
      );
    }

    if (!user) {
      return { commission, role: "SECRETARIO" };
    }

    const role = toCanonicalRole(user.role?.name, {
      isDirective: user.isDirective,
    });

    if (!role) {
      throw new ForbiddenException("Invalid role");
    }

    if (role === "DOCENTE" && commission.teacherId !== user.id) {
      throw new ForbiddenException(
        "You are not assigned to this subject commission"
      );
    }

    if (role === "ALUMNO") {
      if (!options.allowStudent) {
        throw new ForbiddenException("Students cannot modify grades");
      }

      if (options.targetStudentId && options.targetStudentId !== user.id) {
        throw new ForbiddenException("Students can only access their own row");
      }
    }

    return { commission, role };
  }

  private async fetchGradeRows(
    subjectCommissionId: number,
    studentIds?: string[]
  ): Promise<GradeRowDto[]> {
    const qb = this.progressRepo
      .createQueryBuilder("ssp")
      .innerJoin("ssp.student", "student")
      .innerJoin("student.user", "u")
      .leftJoin("ssp.status", "status")
      .leftJoin("ssp.subjectCommission", "sc")
      .where("ssp.subjectCommissionId = :subjectCommissionId", {
        subjectCommissionId,
      });

    if (studentIds && studentIds.length > 0) {
      qb.andWhere("ssp.studentId IN (:...studentIds)", { studentIds });
    }

    qb.select([
      "ssp.student_id AS student_id",
      "student.legajo AS legajo",
      "u.name AS user_name",
      "u.last_name AS user_last_name",
      "(ssp.partial_scores ->> '1')::numeric AS partial1",
      "(ssp.partial_scores ->> '2')::numeric AS partial2",
      "(ssp.partial_scores ->> 'final')::numeric AS final",
      "COALESCE(ssp.attendance_percentage::numeric, 0) AS attendance",
      "status.status_name AS condition",
      `(
        SELECT COALESCE(SUM(array_length(sa.dates, 1)), 0)
        FROM subject_absences sa
        WHERE sa.student_id = ssp.student_id
          AND sa.subject_id = sc.subject_id
      ) AS absences_count`,
    ])
      .orderBy("u.last_name", "ASC")
      .addOrderBy("u.name", "ASC");

    const rows = await qb.getRawMany();
    return rows.map((raw) => {
      const partial1 = raw["partial1"];
      const partial2 = raw["partial2"];
      const finalScore = raw["final"];
      const attendance = raw["attendance"];
      const absences = raw["absences_count"];

      return {
        studentId: raw["student_id"],
        fullName: [raw["user_name"], raw["user_last_name"]]
          .filter(Boolean)
          .join(" ")
          .trim(),
        legajo: raw["legajo"],
        partial1: partial1 !== null ? Number(partial1) : null,
        partial2: partial2 !== null ? Number(partial2) : null,
        final: finalScore !== null ? Number(finalScore) : null,
        attendance: attendance !== null ? Number(attendance) : 0,
        condition: raw["condition"] ?? null,
        absencesCount:
          absences !== undefined && absences !== null
            ? Number(absences)
            : undefined,
      };
    });
  }

  private normalizeScore(value: any): number | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const num = Number(value);
    if (Number.isNaN(num)) {
      throw new BadRequestException("Score must be a numeric value or null");
    }
    return num;
  }

  private normalizeAttendance(value: any): number {
    if (value === undefined || value === null) {
      throw new BadRequestException("Attendance value is required");
    }
    const num = Number(value);
    if (Number.isNaN(num)) {
      throw new BadRequestException("Attendance must be numeric");
    }
    if (num < 0 || num > 100) {
      throw new BadRequestException("Attendance must be between 0 and 100");
    }
    return num;
  }

  private normalizeStatusId(value: any): number | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }
    const num = Number(value);
    if (!Number.isInteger(num)) {
      throw new BadRequestException("statusId must be an integer or null");
    }
    return num;
  }

  private async ensureStudentEnrollment(
    subjectId: number,
    studentId: string,
    manager?: EntityManager
  ): Promise<void> {
    const repo =
      manager?.getRepository(SubjectStudent) ?? this.subjectStudentRepo;
    const enrolled = await repo.exist({
      where: { subjectId, studentId },
    });
    if (!enrolled) {
      throw new BadRequestException(
        "Student is not enrolled in the subject commission"
      );
    }
  }

  private async upsertGradeRow(
    manager: EntityManager,
    commission: Pick<SubjectCommission, "subjectId">,
    subjectCommissionId: number,
    row: UpsertGradeDto["rows"][number]
  ): Promise<void> {
    if (!row) return;
    const studentId = row.studentId;
    if (!studentId) {
      throw new BadRequestException("studentId is required");
    }

    let progress = await manager.findOne(StudentSubjectProgress, {
      where: { subjectCommissionId, studentId },
    });

    if (!progress) {
      await this.ensureStudentEnrollment(
        commission.subjectId,
        studentId,
        manager
      );
      progress = manager.create(StudentSubjectProgress, {
        subjectCommissionId,
        studentId,
        partialScores: {},
        attendancePercentage: "0",
        statusId: null,
      });
    }

    const scores = { ...(progress.partialScores ?? {}) };

    if (row.partial1 !== undefined) {
      if (row.partial1 === null) {
        delete scores["1"];
      } else {
        scores["1"] = Number(row.partial1);
      }
    }
    if (row.partial2 !== undefined) {
      if (row.partial2 === null) {
        delete scores["2"];
      } else {
        scores["2"] = Number(row.partial2);
      }
    }
    if (row.final !== undefined) {
      if (row.final === null) {
        delete scores["final"];
      } else {
        scores["final"] = Number(row.final);
      }
    }

    progress.partialScores =
      Object.keys(scores).length > 0 ? scores : null;

    if (row.attendance !== undefined) {
      const attendance = this.normalizeAttendance(row.attendance);
      progress.attendancePercentage = attendance.toFixed(2);
    }

    if (row.statusId !== undefined) {
      if (row.statusId === null) {
        progress.statusId = null;
      } else {
        if (!Number.isInteger(row.statusId)) {
          throw new BadRequestException("statusId must be an integer");
        }
        const exists = await manager.exists(SubjectStatusType, {
          where: { id: row.statusId },
        });
        if (!exists) {
          throw new BadRequestException("statusId does not exist");
        }
        progress.statusId = row.statusId;
      }
    }

    await manager.save(progress);
  }
}
