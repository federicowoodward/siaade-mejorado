import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { AcademicPeriod } from "@/entities/catalogs/academic-period.entity";
import { Career } from "@/entities/registration/career.entity";
import { Commission } from "@/entities/catalogs/commission.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { FinalExamStatus } from "@/entities/finals/final-exam-status.entity";
import { SubjectStatusType } from "@/entities/catalogs/subject-status-type.entity";

@Injectable()
export class CatalogsService {
  constructor(
    @InjectRepository(AcademicPeriod)
    private readonly academicPeriodRepo: Repository<AcademicPeriod>,
    @InjectRepository(Career)
    private readonly careerRepo: Repository<Career>,
    @InjectRepository(Commission)
    private readonly commissionRepo: Repository<Commission>,
    @InjectRepository(CareerSubject)
    private readonly careerSubjectRepo: Repository<CareerSubject>,
    @InjectRepository(SubjectCommission)
    private readonly subjectCommissionRepo: Repository<SubjectCommission>,
    @InjectRepository(CareerStudent)
    private readonly careerStudentRepo: Repository<CareerStudent>,
    @InjectRepository(FinalExamStatus)
    private readonly finalExamStatusRepo: Repository<FinalExamStatus>,
    @InjectRepository(SubjectStatusType)
    private readonly subjectStatusTypeRepo: Repository<SubjectStatusType>
  ) {}

  findAcademicPeriods(opts?: { skip?: number; take?: number }) {
    return this.academicPeriodRepo.findAndCount({
      order: { academicPeriodId: "ASC" },
      skip: opts?.skip,
      take: opts?.take,
    });
  }

  findCareers(opts?: { skip?: number; take?: number }) {
    return this.careerRepo.findAndCount({
      order: { id: "ASC" },
      skip: opts?.skip,
      take: opts?.take,
    });
  }

  findCommissions(opts?: { skip?: number; take?: number }) {
    return this.commissionRepo.findAndCount({
      order: { id: "ASC" },
      skip: opts?.skip,
      take: opts?.take,
    });
  }

  async findCareerFullData(careerId: number) {
    const career = await this.careerRepo
      .createQueryBuilder("career")
      .leftJoinAndSelect("career.academicPeriod", "careerPeriod")
      .leftJoinAndSelect("career.preceptor", "preceptor")
      .leftJoinAndSelect("preceptor.user", "preceptorUser")
      .where("career.id = :careerId", { careerId })
      .getOne();

    if (!career) {
      throw new NotFoundException(
        `Career with id ${careerId} was not found`
      );
    }

    const careerSubjects = await this.careerSubjectRepo
      .createQueryBuilder("cs")
      .leftJoinAndSelect("cs.subject", "subject")
      .leftJoinAndSelect("subject.academicPeriod", "subjectPeriod")
      .where("cs.careerId = :careerId", { careerId })
      .orderBy("cs.yearNo", "ASC", "NULLS LAST")
      .addOrderBy("cs.periodOrder", "ASC", "NULLS LAST")
      .addOrderBy("cs.orderNo", "ASC")
      .getMany();

    const subjectIds = new Set<number>();
    for (const cs of careerSubjects) {
      if (cs.subject) {
        subjectIds.add(cs.subject.id);
      }
    }

    const subjectTeacherMap = new Map<number, string>();
    if (subjectIds.size > 0) {
      const commissions = await this.subjectCommissionRepo.find({
        where: {
          subjectId: In(Array.from(subjectIds)),
          active: true,
        },
        order: { subjectId: "ASC", id: "ASC" },
        select: ["id", "subjectId", "teacherId"],
      });
      for (const commission of commissions) {
        if (
          commission.teacherId &&
          !subjectTeacherMap.has(commission.subjectId)
        ) {
          subjectTeacherMap.set(commission.subjectId, commission.teacherId);
        }
      }
    }

    type PeriodKey = number | "no_period";
    const periods = new Map<
      PeriodKey,
      {
        academicPeriod: AcademicPeriod | null;
        subjects: Array<{
          id: number;
          subjectName: string;
          academicPeriodId: number | null;
          orderNo: number | null;
          careerOrdering: {
            yearNo: number | null;
            periodOrder: number | null;
            orderNo: number;
          };
          metadata: {
            correlative: string | null;
            subjectFormat: string | null;
            teacherFormation: string | null;
            annualWorkload: string | null;
            weeklyWorkload: string | null;
            teacherId: string | null;
          };
        }>;
      }
    >();

    for (const cs of careerSubjects) {
      if (!cs.subject) continue;
      const period = cs.subject.academicPeriod ?? null;
      const periodKey: PeriodKey =
        period?.academicPeriodId ?? "no_period";
      if (!periods.has(periodKey)) {
        periods.set(periodKey, {
          academicPeriod: period,
          subjects: [],
        });
      }

      periods.get(periodKey)!.subjects.push({
        id: cs.subject.id,
        subjectName: cs.subject.subjectName,
        academicPeriodId: cs.subject.academicPeriodId ?? null,
        orderNo: cs.subject.orderNo ?? null,
        careerOrdering: {
          yearNo: cs.yearNo ?? null,
          periodOrder: cs.periodOrder ?? null,
          orderNo: cs.orderNo,
        },
        metadata: {
          correlative: cs.subject.correlative ?? null,
          subjectFormat: cs.subject.subjectFormat ?? null,
          teacherFormation: cs.subject.teacherFormation ?? null,
          annualWorkload: cs.subject.annualWorkload ?? null,
          weeklyWorkload: cs.subject.weeklyWorkload ?? null,
          teacherId: subjectTeacherMap.get(cs.subject.id) ?? null,
        },
      });
    }

    const academicPeriods = Array.from(periods.entries())
      .map(([key, value]) => {
        value.subjects.sort((a, b) => {
          const yearA = a.careerOrdering.yearNo ?? Number.MAX_SAFE_INTEGER;
          const yearB = b.careerOrdering.yearNo ?? Number.MAX_SAFE_INTEGER;
          if (yearA !== yearB) return yearA - yearB;
          const periodA =
            a.careerOrdering.periodOrder ?? Number.MAX_SAFE_INTEGER;
          const periodB =
            b.careerOrdering.periodOrder ?? Number.MAX_SAFE_INTEGER;
          if (periodA !== periodB) return periodA - periodB;
          return a.careerOrdering.orderNo - b.careerOrdering.orderNo;
        });

        return {
          academicPeriod: value.academicPeriod
            ? {
                id: value.academicPeriod.academicPeriodId,
                name: value.academicPeriod.periodName,
                partialsScoreNeeded:
                  value.academicPeriod.partialsScoreNeeded,
              }
            : null,
          subjects: value.subjects,
          sortKey:
            value.academicPeriod?.academicPeriodId ?? Number.MAX_SAFE_INTEGER,
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey, ...rest }) => rest);

    return {
      career: {
        id: career.id,
        name: career.careerName,
        createdAt: career.createdAt,
        academicPeriod: career.academicPeriod
          ? {
              id: career.academicPeriod.academicPeriodId,
              name: career.academicPeriod.periodName,
              partialsScoreNeeded:
                career.academicPeriod.partialsScoreNeeded,
            }
          : null,
      },
      preceptor: career.preceptor
        ? {
            userId: career.preceptor.userId,
            name: career.preceptor.user?.name ?? null,
            lastName: career.preceptor.user?.lastName ?? null,
            email: career.preceptor.user?.email ?? null,
          }
        : null,
      academicPeriods,
    };
  }

  async findCareerStudentsByCommission(
    careerId: number,
    opts?: { studentStartYear?: number }
  ) {
    const career = await this.careerRepo.findOne({
      where: { id: careerId },
    });

    if (!career) {
      throw new NotFoundException(
        `Career with id ${careerId} was not found`
      );
    }

    const qb = this.careerStudentRepo
      .createQueryBuilder("cs")
      .innerJoinAndSelect("cs.student", "student")
      .leftJoinAndSelect("student.user", "user")
      .leftJoinAndSelect("student.commission", "commission")
      .where("cs.careerId = :careerId", { careerId });

    if (opts?.studentStartYear !== undefined) {
      qb.andWhere("student.studentStartYear = :studentStartYear", {
        studentStartYear: opts.studentStartYear,
      });
    }

    qb.orderBy("commission.id", "ASC", "NULLS LAST")
      .addOrderBy("student.legajo", "ASC")
      .addOrderBy("student.userId", "ASC");

    const assignments = await qb.getMany();

    type GroupKey = number | "no_commission";
    const grouped = new Map<
      GroupKey,
      {
        commissionId: number | null;
        commissionLetter: string | null;
        students: Array<{
          userId: string;
          legajo: string;
          studentStartYear: number;
          isActive: boolean | null;
          canLogin: boolean | null;
          commissionId: number | null;
          user: {
            name: string;
            lastName: string;
            email: string;
          };
        }>;
      }
    >();

    for (const cs of assignments) {
      const student = cs.student;
      if (!student) continue;

      const key: GroupKey =
        student.commission?.id ?? student.commissionId ?? "no_commission";

      if (!grouped.has(key)) {
        grouped.set(key, {
          commissionId: student.commission?.id ?? student.commissionId ?? null,
          commissionLetter: student.commission?.commissionLetter ?? null,
          students: [],
        });
      }

      grouped.get(key)!.students.push({
        userId: student.userId,
        legajo: student.legajo,
        studentStartYear: student.studentStartYear,
        isActive: student.isActive,
        canLogin: student.canLogin,
        commissionId: student.commission?.id ?? student.commissionId ?? null,
        user: {
          name: student.user?.name ?? "",
          lastName: student.user?.lastName ?? "",
          email: student.user?.email ?? "",
        },
      });
    }

    const commissions = Array.from(grouped.values()).map((entry) => {
      entry.students.sort((a, b) => a.legajo.localeCompare(b.legajo));
      return entry;
    });

    commissions.sort((a, b) => {
      const idA = a.commissionId ?? Number.MAX_SAFE_INTEGER;
      const idB = b.commissionId ?? Number.MAX_SAFE_INTEGER;
      return idA - idB;
    });

    return {
      career: {
        id: career.id,
        name: career.careerName,
      },
      filters: {
        studentStartYear: opts?.studentStartYear ?? null,
      },
      commissions,
    };
  }

  async findCommissionSubjects(commissionId: number) {
    const assignments = await this.subjectCommissionRepo
      .createQueryBuilder("sc")
      .leftJoinAndSelect("sc.subject", "subject")
      .leftJoinAndSelect("sc.commission", "commission")
      .leftJoinAndSelect("sc.teacher", "teacher")
      .where("sc.commissionId = :commissionId", { commissionId })
      .orderBy("subject.subjectName", "ASC")
      .addOrderBy("sc.id", "ASC")
      .getMany();

    if (assignments.length === 0) {
      const commission = await this.commissionRepo.findOne({
        where: { id: commissionId },
      });
      if (!commission) {
        throw new NotFoundException(
          `Commission with id ${commissionId} was not found`
        );
      }
      return { commission, subjects: [] };
    }

    const { commission } = assignments[0];
    return {
      commission,
      subjects: assignments.map((assignment) => ({
        subjectCommissionId: assignment.id,
        subject: assignment.subject,
        teacher: assignment.teacher,
        active: assignment.active,
      })),
    };
  }
}
