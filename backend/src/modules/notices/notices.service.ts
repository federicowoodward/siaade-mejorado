import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Notice } from "@/entities/notices/notice.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { Role } from "@/entities/roles/role.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { CreateNoticeDto } from "./dto/create-notice.dto";
import { UpdateNoticeDto } from "./dto/update-notice.dto";
import { ROLE, ROLE_IDS } from "@/shared/rbac/roles.constants";

export type AuthenticatedUser = { id?: string; role?: ROLE | null };

@Injectable()
export class NoticesService {
  private readonly segmentByCommission =
    process.env.NOTICES_SEGMENT_BY_COMMISSION === "true";

  constructor(
    @InjectRepository(Notice)
    private readonly repo: Repository<Notice>,
    @InjectRepository(SubjectCommission)
    private readonly subjectCommissionRepo: Repository<SubjectCommission>,
    @InjectRepository(SubjectStudent)
    private readonly subjectStudentRepo: Repository<SubjectStudent>,
    @InjectRepository(CareerSubject)
    private readonly careerSubjectRepo: Repository<CareerSubject>,
    @InjectRepository(CareerStudent)
    private readonly careerStudentRepo: Repository<CareerStudent>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}

  get segmentingByCommission(): boolean {
    return this.segmentByCommission;
  }

  async create(dto: CreateNoticeDto, createdByUserId?: string) {
    const notice = this.repo.create({
      title: dto.title,
      content: dto.content,
      visibleRoleId: this.resolveVisibleRoleId(dto.visibleFor),
      createdByUserId: createdByUserId ?? null,
      subjectCommissionIds: dto.commissionIds ?? [],
      yearNumbers: dto.yearNumbers ?? [],
    });
    const saved = await this.repo.save(notice);
    return this.findOneForReturn(saved.id);
  }

  async update(id: number, dto: UpdateNoticeDto) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException("Notice not found");
    if (dto.title !== undefined) existing.title = dto.title;
    if (dto.content !== undefined) existing.content = dto.content;
    if (dto.visibleFor !== undefined) {
      existing.visibleRoleId = this.resolveVisibleRoleId(dto.visibleFor);
    }
    if (dto.commissionIds !== undefined) {
      existing.subjectCommissionIds = dto.commissionIds;
    }
    if (dto.yearNumbers !== undefined) {
      existing.yearNumbers = dto.yearNumbers;
    }
    await this.repo.save(existing);
    return this.findOneForReturn(id);
  }

  async remove(id: number) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) return { id, affected: 0 } as any;
    await this.repo.delete(id);
    return { id, affected: 1 } as any;
  }

  async findAllByAudience(
    audience: "student" | "teacher" | "all" | undefined,
    opts: { skip?: number; take?: number } | undefined,
    user?: AuthenticatedUser,
  ) {
    const qb = this.repo
      .createQueryBuilder("n")
      .orderBy("n.created_at", "DESC");

    if (audience === "student") {
      const roleId = await this.resolveRoleId("student");
      qb.andWhere(
        "n.visible_role_id IS NULL OR n.visible_role_id = :studentRoleId",
        { studentRoleId: roleId },
      );
    } else if (audience === "teacher") {
      const roleId = await this.resolveRoleId("teacher");
      qb.andWhere(
        "n.visible_role_id IS NULL OR n.visible_role_id = :teacherRoleId",
        { teacherRoleId: roleId },
      );
    }

    if (opts?.skip !== undefined) qb.skip(opts.skip);
    if (opts?.take !== undefined) qb.take(opts.take);

    if (this.segmentByCommission && user?.role === ROLE.STUDENT) {
      const commissionIds = user.id
        ? await this.resolveStudentCommissionIds(user.id)
        : [];
      if (commissionIds.length > 0) {
        qb.andWhere(
          `
            (n.subject_commission_ids IS NULL OR jsonb_array_length(n.subject_commission_ids) = 0)
            OR n.subject_commission_ids @> to_jsonb(:commissionIds::int[])
          `,
          { commissionIds: JSON.stringify(commissionIds) },
        );
      } else {
        qb.andWhere(
          `(n.subject_commission_ids IS NULL OR jsonb_array_length(n.subject_commission_ids) = 0)`,
        );
      }
    }

    if (audience === "student" && user?.id) {
      const studentYears = await this.resolveStudentYears(user.id);
      if (studentYears.length > 0) {
        qb.andWhere(
          `
            (n.year_numbers IS NULL OR jsonb_array_length(n.year_numbers) = 0)
            OR n.year_numbers && to_jsonb(:studentYears::int[])
          `,
          { studentYears: JSON.stringify(studentYears) },
        );
      } else {
        qb.andWhere(
          `(n.year_numbers IS NULL OR jsonb_array_length(n.year_numbers) = 0)`,
        );
      }
    }

    const [rows, total] = await qb.getManyAndCount();
    const mapped = await Promise.all(rows.map((row) => this.mapNotice(row)));
    return [mapped, total] as const;
  }

  private async findOneForReturn(id: number) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException("Notice not found");
    return this.mapNotice(entity);
  }

  private async mapNotice(entity: Notice) {
    const visibleFor =
      entity.visibleRoleId === ROLE_IDS[ROLE.TEACHER]
        ? "teacher"
        : entity.visibleRoleId === ROLE_IDS[ROLE.STUDENT]
          ? "student"
          : "all";

    // Cargar datos de las comisiones si es necesario
    const commissionTargets = [];
    const subjectCommissionIds = entity.subjectCommissionIds || [];

    for (const scId of subjectCommissionIds) {
      const sc = await this.subjectCommissionRepo.findOne({
        where: { id: scId },
        relations: ["subject", "commission"],
      });
      if (sc) {
        commissionTargets.push({
          id: scId,
          label: this.buildCommissionLabel(sc),
        });
      }
    }

    return {
      id: entity.id,
      title: entity.title,
      content: entity.content,
      visibleFor,
      createdBy: "Secretaria",
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      commissionTargets,
      hasCommissionFilter: commissionTargets.length > 0,
    };
  }

  private buildCommissionLabel(subjectCommission: SubjectCommission): string {
    const subjectName =
      subjectCommission.subject?.subjectName ??
      `Materia ${subjectCommission.subjectId}`;
    const commissionCode =
      subjectCommission.commission?.commissionLetter ??
      `Com ${subjectCommission.id}`;
    return `${subjectName} · Comision ${commissionCode}`;
  }

  private resolveVisibleRoleId(
    audience?: "student" | "teacher" | "all",
  ): number | null {
    if (audience === "teacher") return ROLE_IDS[ROLE.TEACHER];
    if (audience === "student") return ROLE_IDS[ROLE.STUDENT];
    return null;
  }

  private async resolveStudentCommissionIds(studentId: string) {
    const rows = await this.subjectStudentRepo
      .createQueryBuilder("ss")
      .select("DISTINCT ss.commission_id", "commission_id")
      .where("ss.student_id = :studentId", { studentId })
      .andWhere("ss.commission_id IS NOT NULL")
      .getRawMany<{ commission_id: number }>();
    return rows
      .map((row) => Number(row.commission_id))
      .filter((value) => Number.isFinite(value));
  }

  private async resolveRoleId(
    audience: "student" | "teacher",
  ): Promise<number> {
    const slug = audience === "student" ? ROLE.STUDENT : ROLE.TEACHER;

    const role = await this.rolesRepo.findOne({
      where: { name: slug },
    });
    if (!role) {
      throw new NotFoundException(`Role for '${audience}' not found`);
    }
    return role.id;
  }

  private async resolveStudentYears(studentId: string): Promise<number[]> {
    const careerStudent = await this.careerStudentRepo.findOne({
      where: { studentId },
    });

    if (!careerStudent) {
      return [];
    }

    const subjectStudents = await this.subjectStudentRepo.find({
      where: { studentId },
      select: ["subjectId"],
    });

    if (subjectStudents.length === 0) {
      return [];
    }

    const subjectIds = subjectStudents
      .map((ss) => ss.subjectId)
      .filter((id) => id != null);

    if (subjectIds.length === 0) {
      return [];
    }

    const careerSubjects = await this.careerSubjectRepo.find({
      where: {
        careerId: careerStudent.careerId,
        subjectId: In(subjectIds),
      },
      select: ["yearNo"],
    });

    const years = new Set<number>();
    for (const cs of careerSubjects) {
      if (cs.yearNo != null && cs.yearNo > 0) {
        years.add(cs.yearNo);
      }
    }

    return Array.from(years).sort((a, b) => a - b);
  }
}
