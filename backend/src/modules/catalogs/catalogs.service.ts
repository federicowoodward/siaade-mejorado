import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicPeriod } from '@/entities/catalogs/academic-period.entity';
import { Career } from '@/entities/registration/career.entity';
import { Commission } from '@/entities/catalogs/commission.entity';
import { SubjectCommission } from '@/entities/subjects/subject-commission.entity';
import { FinalExamStatus } from '@/entities/finals/final-exam-status.entity';
import { SubjectStatusType } from '@/entities/catalogs/subject-status-type.entity';

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
    private readonly subjectStatusTypeRepo: Repository<SubjectStatusType>,
  ) {}

  findAcademicPeriods(opts?: { skip?: number; take?: number }) {
    return this.academicPeriodRepo.findAndCount({ order: { academicPeriodId: 'ASC' }, skip: opts?.skip, take: opts?.take });
  }

  findCareers(opts?: { skip?: number; take?: number }) {
    return this.careerRepo.findAndCount({ order: { id: 'ASC' }, skip: opts?.skip, take: opts?.take });
  }

  findCommissions(opts?: { skip?: number; take?: number }) {
    return this.commissionRepo.findAndCount({ order: { id: 'ASC' }, skip: opts?.skip, take: opts?.take });
  }

  findSubjectCommissions(filter?: { subjectId?: number; teacherId?: string }, opts?: { skip?: number; take?: number }) {
    const qb = this.subjectCommissionRepo
      .createQueryBuilder('sc')
      .leftJoinAndSelect('sc.subject', 'subject')
      .leftJoinAndSelect('sc.commission', 'commission')
      .leftJoinAndSelect('sc.teacher', 'teacher')
      .orderBy('sc.id', 'ASC');
    if (filter?.subjectId) {
      qb.andWhere('sc.subjectId = :subjectId', { subjectId: filter.subjectId });
    }
    if (filter?.teacherId) {
      qb.andWhere('sc.teacherId = :teacherId', { teacherId: filter.teacherId });
    }
    if (opts?.skip !== undefined) qb.skip(opts.skip);
    if (opts?.take !== undefined) qb.take(opts.take);
    return qb.getManyAndCount();
  }

  findFinalExamStatus() {
    return this.finalExamStatusRepo.findAndCount({ order: { id: 'ASC' } });
  }

  findSubjectStatusTypes() {
    return this.subjectStatusTypeRepo.findAndCount({ order: { id: 'ASC' } });
  }
}


