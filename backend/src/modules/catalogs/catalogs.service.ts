import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AcademicPeriod } from "@/entities/catalogs/academic-period.entity";
import { Career } from "@/entities/registration/career.entity";
import { Commission } from "@/entities/catalogs/commission.entity";
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
    @InjectRepository(SubjectCommission)
    private readonly subjectCommissionRepo: Repository<SubjectCommission>,
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
