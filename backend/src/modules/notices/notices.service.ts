import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notice } from "@/entities/notices/notice.entity";
import { NoticeCommission } from "@/entities/notices/notice-commission.entity";
import { Role } from "@/entities/roles/role.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";
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
    @InjectRepository(NoticeCommission)
    private readonly noticeCommissionRepo: Repository<NoticeCommission>,
    @InjectRepository(SubjectStudent)
    private readonly subjectStudentRepo: Repository<SubjectStudent>,
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
    });
    const saved = await this.repo.save(notice);
    await this.syncNoticeCommissions(saved.id, dto.commissionIds);
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
    await this.repo.save(existing);
    if (dto.commissionIds !== undefined) {
      await this.syncNoticeCommissions(id, dto.commissionIds);
    }
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
      .leftJoinAndSelect("n.noticeCommissions", "nc")
      .leftJoinAndSelect("nc.subjectCommission", "sc")
      .leftJoinAndSelect("sc.subject", "subject")
      .leftJoinAndSelect("sc.commission", "commission")
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
            NOT EXISTS (
              SELECT 1 FROM notice_commissions nc_all WHERE nc_all.notice_id = n.id
            )
            OR EXISTS (
              SELECT 1 FROM notice_commissions nc_match
              WHERE nc_match.notice_id = n.id
                AND nc_match.subject_commission_id IN (:...commissionIds)
            )
          `,
          { commissionIds },
        );
      } else {
        qb.andWhere(
          `NOT EXISTS (
            SELECT 1 FROM notice_commissions nc_all WHERE nc_all.notice_id = n.id
          )`,
        );
      }
    }

    const [rows, total] = await qb.getManyAndCount();
    const mapped = rows.map((row) => this.mapNotice(row));
    return [mapped, total] as const;
  }

  private async findOneForReturn(id: number) {
    const entity = await this.repo
      .createQueryBuilder("n")
      .leftJoinAndSelect("n.noticeCommissions", "nc")
      .leftJoinAndSelect("nc.subjectCommission", "sc")
      .leftJoinAndSelect("sc.subject", "subject")
      .leftJoinAndSelect("sc.commission", "commission")
      .where("n.id = :id", { id })
      .getOne();
    if (!entity) throw new NotFoundException("Notice not found");
    return this.mapNotice(entity);
  }

  private mapNotice(entity: Notice) {
    const visibleFor =
      entity.visibleRoleId === ROLE_IDS[ROLE.TEACHER]
        ? "teacher"
        : entity.visibleRoleId === ROLE_IDS[ROLE.STUDENT]
          ? "student"
          : "all";

    const commissionTargets =
      entity.noticeCommissions?.map((nc) => ({
        id: nc.subjectCommissionId,
        label: this.buildCommissionLabel(nc.subjectCommission, nc.id),
      })) ?? [];

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

  private buildCommissionLabel(
    subjectCommission: NoticeCommission["subjectCommission"],
    fallbackId: number,
  ): string {
    if (!subjectCommission) {
      return `Comision ${fallbackId}`;
    }
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

  private async syncNoticeCommissions(
    noticeId: number,
    commissionIds?: number[],
  ) {
    await this.noticeCommissionRepo.delete({ noticeId });
    if (!commissionIds || commissionIds.length === 0) {
      return;
    }
    const uniqueIds = Array.from(
      new Set(commissionIds.map((value) => Number(value)).filter((v) => v)),
    );
    if (!uniqueIds.length) return;
    const rows = uniqueIds.map((subjectCommissionId) =>
      this.noticeCommissionRepo.create({
        noticeId,
        subjectCommissionId,
      }),
    );
    await this.noticeCommissionRepo.save(rows);
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
}
