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
import { Subject } from "@/entities/subjects/subject.entity";
import { SubjectGradesView } from "@/subjects/views/subject-grades.view";
import { User } from "@/entities/users/user.entity";
import { UpsertGradeDto } from "./dto/upsert-grade.dto";
import { PatchCellDto } from "./dto/patch-cell.dto";
import { GradeRowDto } from "./dto/grade-row.dto";
import { UpdateSubjectGradeDto } from "./dto/update-subject-grade.dto";
import { ROLE } from "@/shared/rbac/roles.constants";

type AuthenticatedUser = {
  id: string;
  role?: ROLE | null;
};

type CommissionWithRole = {
  commission: Pick<SubjectCommission, "id" | "subjectId" | "teacherId">;
  role: ROLE;
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
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
    @InjectRepository(SubjectGradesView)
    private readonly subjectGradesViewRepo: Repository<SubjectGradesView>,
    private readonly dataSource: DataSource
  ) {}

  async getGrades(subjectCommissionId: number): Promise<GradeRowDto[]> {
    await this.ensureCommissionExists(subjectCommissionId);
    const rows = await this.fetchGradeRows(subjectCommissionId, undefined);
    return rows;
  }

  async patchCell(
    subjectCommissionId: number,
    studentId: string,
    dto: PatchCellDto,
    user?: AuthenticatedUser
  ): Promise<GradeRowDto> {
    const { commission } = await this.ensureAccess(subjectCommissionId, user, {
      allowStudent: false,
      targetStudentId: studentId,
    });

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
      case "note1":
      case "note2":
      case "note3":
      case "note4":
      case "partial1":
      case "partial2":
      case "final": {
        const expected = await this.getExpectedPartialsForSubject(
          commission.subjectId
        );
        const { notes } = this.mapAliasToNotes(
          { [dto.path]: dto.value },
          expected
        );
        const scores = { ...(progress.partialScores ?? {}) };
        (["1", "2", "3", "4"] as const).forEach((key) => {
          const value = notes[key];
          if (value === undefined) {
            return;
          }
          const normalized = this.normalizeScore(value);
          if (normalized === null) {
            delete scores[key];
            return;
          }
          scores[key] = normalized;
        });
        delete (scores as Record<string, number>)["final"];
        progress.partialScores = Object.keys(scores).length > 0 ? scores : null;
        break;
      }
      case "percentage":
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
    const { commission } = await this.ensureAccess(subjectCommissionId, user, {
      allowStudent: false,
    });

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

  async getSubjectStatuses(): Promise<
    Array<{ id: number; statusName: string }>
  > {
    const rows = await this.statusRepo.find({
      order: { id: "ASC" },
    });
    return rows.map(({ id, statusName }) => ({
      id,
      statusName,
    }));
  }

  async getSubjectGradesBySubject(subjectId: number): Promise<{
    subject: { id: number; name: string };
    commissions: Array<{
      commission: { id: number; letter: string | null };
      partials: 2 | 4;
      rows: GradeRowDto[];
    }>;
  }> {
    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject ${subjectId} was not found`);
    }

    const commissions = await this.subjectCommissionRepo
      .createQueryBuilder("sc")
      .leftJoinAndSelect("sc.commission", "commission")
      .leftJoinAndSelect("sc.subject", "subjectEntity")
      .leftJoinAndSelect("subjectEntity.academicPeriod", "ap")
      .where("sc.subjectId = :subjectId", { subjectId })
      .orderBy("commission.commissionLetter", "ASC", "NULLS LAST")
      .addOrderBy("sc.id", "ASC")
      .getMany();

    const viewRows = await this.subjectGradesViewRepo
      .createQueryBuilder("vg")
      .where("vg.subject_id = :subjectId", { subjectId })
      .orderBy("vg.commission_letter", "ASC", "NULLS LAST")
      .addOrderBy("vg.commission_id", "ASC")
      .addOrderBy("vg.full_name", "ASC")
      .getMany();

    const grouped = new Map<number, { partials: 2 | 4; rows: GradeRowDto[] }>();
    for (const row of viewRows) {
      const dto = this.mapViewToGradeRow(row);
      const partials = this.normalizePartials(row.partials);
      const bucket = grouped.get(row.commissionId);
      if (bucket) {
        bucket.rows.push(dto);
      } else {
        grouped.set(row.commissionId, { partials, rows: [dto] });
      }
    }

    return {
      subject: { id: subject.id, name: subject.subjectName },
      commissions: commissions.map((commission) => {
        const bucket = grouped.get(commission.id);
        if (bucket) {
          return {
            commission: {
              id: commission.id,
              letter: commission.commission?.commissionLetter ?? null,
            },
            partials: bucket.partials,
            rows: bucket.rows,
          };
        }
        const fallbackPartials = this.normalizePartials(
          commission.subject?.academicPeriod?.partialsScoreNeeded ?? null
        );
        return {
          commission: {
            id: commission.id,
            letter: commission.commission?.commissionLetter ?? null,
          },
          partials: fallbackPartials,
          rows: [],
        };
      }),
    };
  }

  async getSubjectAcademicSituation(
    subjectId: number,
    filters?: { q?: string; commissionId?: number }
  ): Promise<{
    subject: { id: number; name: string; partials: 2 | 4 };
    commissions: Array<{ id: number; letter: string | null }>;
    rows: Array<{
      studentId: string;
      fullName: string;
      legajo: string;
      dni: string;
      commissionId: number;
      commissionLetter: string | null;
      note1: number | null;
      note2: number | null;
      note3: number | null;
      note4: number | null;
      final: number | null;
      attendancePercentage: number;
      condition: string | null;
    }>;
  }> {
    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject ${subjectId} was not found`);
    }

    const qb = this.subjectGradesViewRepo
      .createQueryBuilder("vg")
      .leftJoin(User, "user", "user.id = vg.student_id")
      .where("vg.subject_id = :subjectId", { subjectId })
      .orderBy("vg.commission_letter", "ASC", "NULLS LAST")
      .addOrderBy("vg.commission_id", "ASC")
      .addOrderBy("vg.full_name", "ASC")
      .addSelect("user.cuil", "academicSituation_cuil");

    const commissionFilter =
      filters?.commissionId && filters.commissionId > 0
        ? filters.commissionId
        : undefined;
    if (commissionFilter !== undefined) {
      qb.andWhere("vg.commission_id = :commissionId", {
        commissionId: commissionFilter,
      });
    }

    const search = filters?.q?.trim();
    if (search) {
      qb.andWhere(
        "(vg.full_name ILIKE :search OR user.cuil ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    const { entities, raw } = await qb.getRawAndEntities();

    const rows = entities.map((entity, index) => {
      const mapped = this.mapViewToGradeRow(entity);
      const rawRow = raw[index] as Record<string, any>;
      const cuil =
        (rawRow?.academicSituation_cuil as string | null | undefined) ?? "";

      return {
        studentId: mapped.studentId,
        fullName: mapped.fullName,
        legajo: mapped.legajo,
        dni: cuil,
        commissionId: entity.commissionId,
        commissionLetter: entity.commissionLetter ?? null,
        note1: mapped.note1,
        note2: mapped.note2,
        note3: mapped.note3,
        note4: mapped.note4,
        final: mapped.final,
        attendancePercentage: mapped.attendancePercentage,
        condition: mapped.condition,
      };
    });

    const commissions = await this.subjectCommissionRepo
      .createQueryBuilder("sc")
      .leftJoinAndSelect("sc.commission", "commission")
      .where("sc.subjectId = :subjectId", { subjectId })
      .orderBy("commission.commissionLetter", "ASC", "NULLS LAST")
      .addOrderBy("sc.id", "ASC")
      .getMany();

    const subjectPartials = await this.getExpectedPartialsForSubject(subjectId);

    return {
      subject: {
        id: subject.id,
        name: subject.subjectName,
        partials: subjectPartials,
      },
      commissions: commissions.map((commission) => ({
        id: commission.id,
        letter: commission.commission?.commissionLetter ?? null,
      })),
      rows,
    };
  }

  async patchSubjectGrade(
    subjectId: number,
    studentId: string,
    dto: UpdateSubjectGradeDto,
    user?: AuthenticatedUser
  ): Promise<GradeRowDto> {
    const entries = this.collectGradePatchEntries(dto);
    if (entries.length === 0) {
      throw new BadRequestException("At least one grade field is required");
    }
    if (entries.length > 1) {
      throw new BadRequestException(
        "Only one grade field can be updated per request"
      );
    }

    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject ${subjectId} was not found`);
    }

    await this.ensureStudentEnrollment(subjectId, studentId);

    const [path, value] = entries[0];
    const commissionId = await this.resolveSubjectCommissionId(
      subjectId,
      studentId
    );

    return this.patchCell(commissionId, studentId, { path, value }, user);
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

    if (!user || !user.role) {
      throw new ForbiddenException("Invalid role");
    }

    const role = user.role;

    if (role === ROLE.TEACHER && commission.teacherId !== user.id) {
      throw new ForbiddenException(
        "You are not assigned to this subject commission"
      );
    }

    if (role === ROLE.STUDENT) {
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
    const qb = this.subjectGradesViewRepo
      .createQueryBuilder("vg")
      .where("vg.commission_id = :subjectCommissionId", { subjectCommissionId })
      .orderBy("vg.full_name", "ASC", "NULLS LAST")
      .addOrderBy("vg.student_id", "ASC");

    if (studentIds?.length) {
      qb.andWhere("vg.student_id IN (:...studentIds)", { studentIds });
    }

    const rows = await qb.getMany();
    return rows.map((row) => this.mapViewToGradeRow(row));
  }

  private async ensureCommissionExists(
    subjectCommissionId: number
  ): Promise<void> {
    const exists = await this.subjectCommissionRepo.exist({
      where: { id: subjectCommissionId },
    });
    if (!exists) {
      throw new NotFoundException(
        `Subject commission ${subjectCommissionId} was not found`
      );
    }
  }

  private async getExpectedPartialsForSubject(
    subjectId: number
  ): Promise<2 | 4> {
    const row = await this.subjectRepo
      .createQueryBuilder("s")
      .leftJoin("s.academicPeriod", "ap")
      .select("COALESCE(ap.partialsScoreNeeded, 2)", "partials")
      .where("s.id = :subjectId", { subjectId })
      .getRawOne<{ partials: string }>();

    const value = Number(row?.partials ?? 2);
    return value === 4 ? 4 : 2;
  }

  private async getExpectedPartialsForCommission(
    commissionId: number
  ): Promise<2 | 4> {
    const row = await this.subjectCommissionRepo
      .createQueryBuilder("sc")
      .innerJoin("sc.subject", "s")
      .leftJoin("s.academicPeriod", "ap")
      .select("COALESCE(ap.partialsScoreNeeded, 2)", "partials")
      .where("sc.id = :commissionId", { commissionId })
      .getRawOne<{ partials: string }>();

    const value = Number(row?.partials ?? 2);
    return value === 4 ? 4 : 2;
  }

  private mapViewToGradeRow(row: SubjectGradesView): GradeRowDto {
    return {
      studentId: row.studentId,
      fullName: (row.fullName ?? "").trim(),
      legajo: row.legajo,
      note1: this.toNullableNumber(row.note1),
      note2: this.toNullableNumber(row.note2),
      note3: this.toNullableNumber(row.note3),
      note4: this.toNullableNumber(row.note4),
      final: this.toNullableNumber(row.final),
      attendancePercentage: this.toNumber(row.attendancePercentage, 0),
      condition: row.condition ?? null,
    };
  }

  private collectGradePatchEntries(
    dto: UpdateSubjectGradeDto
  ): Array<[PatchCellDto["path"], number | null]> {
    const keys: Array<PatchCellDto["path"]> = [
      "note1",
      "note2",
      "note3",
      "note4",
      "partial1",
      "partial2",
      "final",
    ];

    const entries: Array<[PatchCellDto["path"], number | null]> = [];
    for (const key of keys) {
      const value = dto[key as keyof UpdateSubjectGradeDto];
      if (value !== undefined) {
        entries.push([key, value ?? null]);
      }
    }
    return entries;
  }

  private async resolveSubjectCommissionId(
    subjectId: number,
    studentId: string
  ): Promise<number> {
    const row = await this.subjectGradesViewRepo
      .createQueryBuilder("vg")
      .where("vg.subject_id = :subjectId", { subjectId })
      .andWhere("vg.student_id = :studentId", { studentId })
      .orderBy("vg.commission_id", "ASC")
      .getOne();

    if (row?.commissionId) {
      return row.commissionId;
    }

    const commission = await this.subjectCommissionRepo
      .createQueryBuilder("sc")
      .where("sc.subjectId = :subjectId", { subjectId })
      .orderBy("sc.id", "ASC")
      .getOne();

    if (!commission) {
      throw new NotFoundException(
        `No subject commissions found for subject ${subjectId}`
      );
    }

    return commission.id;
  }

  private normalizePartials(value: number | null | undefined): 2 | 4 {
    return value === 4 ? 4 : 2;
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === undefined || value === null) {
      return null;
    }
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }

  private toNumber(value: unknown, fallback = 0): number {
    if (value === undefined || value === null) {
      return fallback;
    }
    const num = Number(value);
    return Number.isNaN(num) ? fallback : num;
  }

  private mapAliasToNotes(
    input: {
      note1?: any;
      note2?: any;
      note3?: any;
      note4?: any;
      partial1?: any;
      partial2?: any;
      final?: any;
      percentage?: any;
      attendance?: any;
    },
    expected: 2 | 4
  ): {
    notes: Record<"1" | "2" | "3" | "4", number | null | undefined>;
    percentage: number | null | undefined;
  } {
    type NoteKey = "1" | "2" | "3" | "4";
    const notes: Record<NoteKey, number | null | undefined> = {
      "1": undefined,
      "2": undefined,
      "3": undefined,
      "4": undefined,
    };

    const pick = (value: any): number | null => {
      if (value === null || value === "" || value === undefined) {
        return null;
      }
      const numeric = Number(value);
      return numeric;
    };

    const hasOwn = (prop: keyof typeof input) =>
      Object.prototype.hasOwnProperty.call(input, prop);

    if (hasOwn("note1")) {
      notes["1"] = pick(input.note1);
    } else if (hasOwn("partial1")) {
      notes["1"] = pick(input.partial1);
    }

    if (hasOwn("note2")) {
      notes["2"] = pick(input.note2);
    } else if (hasOwn("partial2")) {
      notes["2"] = pick(input.partial2);
    }

    if (hasOwn("note3")) {
      notes["3"] = pick(input.note3);
    }

    if (hasOwn("note4")) {
      notes["4"] = pick(input.note4);
    }

    if (hasOwn("final")) {
      const finalValue = pick(input.final);
      const target: NoteKey = expected === 4 ? "4" : "2";
      if (notes[target] === undefined) {
        notes[target] = finalValue;
      }
    }

    let percentage: number | null | undefined;
    if (hasOwn("percentage")) {
      percentage = pick(input.percentage);
    } else if (hasOwn("attendance")) {
      percentage = pick(input.attendance);
    }

    return { notes, percentage };
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

    const expected = await this.getExpectedPartialsForSubject(
      commission.subjectId
    );
    const { notes, percentage } = this.mapAliasToNotes(row, expected);

    const scores = { ...(progress.partialScores ?? {}) };
    (["1", "2", "3", "4"] as const).forEach((key) => {
      const value = notes[key];
      if (value === undefined) {
        return;
      }
      const normalized = this.normalizeScore(value);
      if (normalized === null) {
        delete scores[key];
        return;
      }
      scores[key] = normalized;
    });
    delete (scores as Record<string, number>)["final"];

    progress.partialScores = Object.keys(scores).length > 0 ? scores : null;

    if (percentage !== undefined && percentage !== null) {
      const attendance = this.normalizeAttendance(percentage);
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
