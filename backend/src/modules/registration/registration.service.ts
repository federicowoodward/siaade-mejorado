import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationEnrollment, RegistrationStage, RegistrationStageType } from '@/entities/registration_stage.entity';
import { Career } from '@/entities/careers.entity';
import { SubjectCommission } from '@/entities/subject_commissions.entity';
import { Student } from '@/entities/students.entity';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(RegistrationStageType) private typeRepo: Repository<RegistrationStageType>,
    @InjectRepository(RegistrationStage) private stageRepo: Repository<RegistrationStage>,
    @InjectRepository(RegistrationEnrollment) private enrollRepo: Repository<RegistrationEnrollment>,
    @InjectRepository(Career) private careerRepo: Repository<Career>,
    @InjectRepository(SubjectCommission) private subjComRepo: Repository<SubjectCommission>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
  ) {}

  listTypes() { return this.typeRepo.find({ order: { id: 'ASC' } }); }

  async listStages(careerId: number, activeOnly = false, opts?: { skip?: number; take?: number }) {
    if (!careerId) throw new BadRequestException('career_id is required');
    const qb = this.stageRepo.createQueryBuilder('st')
      .where('st.careerId = :cid', { cid: careerId })
      .orderBy('st.startAt', 'DESC')
      .addOrderBy('st.id', 'DESC');
    if (activeOnly) qb.andWhere('st.startAt <= now() AND st.endAt >= now()');
    if (opts?.skip !== undefined) qb.skip(opts.skip);
    if (opts?.take !== undefined) qb.take(opts.take);
    return qb.getManyAndCount();
  }

  async createStage(dto: any) {
    const career = await this.careerRepo.findOne({ where: { id: dto.career_id } });
    if (!career) throw new NotFoundException('Career not found');
    const type = await this.typeRepo.findOne({ where: { id: dto.type_id } });
    if (!type) throw new NotFoundException('RegistrationStageType not found');
    const startAt = new Date(dto.start_at), endAt = new Date(dto.end_at);
    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) throw new BadRequestException('Invalid dates');
    if (startAt > endAt) throw new BadRequestException('start_at must be <= end_at');
    const row = this.stageRepo.create({
      careerId: career.id, typeId: type.id, periodLabel: dto.period_label ?? null,
      startAt, endAt, createdById: dto.created_by,
      minOrderNo: dto.min_order_no ?? null, maxOrderNo: dto.max_order_no ?? null,
    });
    return this.stageRepo.save(row);
  }

  async editStage(id: number, dto: any) {
    const row = await this.stageRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Stage not found');
    const nextStart = dto.start_at ? new Date(dto.start_at) : row.startAt;
    const nextEnd = dto.end_at ? new Date(dto.end_at) : row.endAt;
    if (nextStart > nextEnd) throw new BadRequestException('start_at must be <= end_at');
    row.periodLabel = dto.period_label ?? row.periodLabel;
    row.startAt = nextStart; row.endAt = nextEnd;
    row.minOrderNo = dto.min_order_no ?? row.minOrderNo;
    row.maxOrderNo = dto.max_order_no ?? row.maxOrderNo;
    return this.stageRepo.save(row);
  }

  async closeStage(id: number) {
    const row = await this.stageRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Stage not found');
    row.endAt = new Date();
    return this.stageRepo.save(row);
  }

  async enroll(dto: any) {
    const stage = await this.stageRepo.findOne({ where: { id: dto.stage_id } });
    if (!stage) throw new NotFoundException('Stage not found');
    const now = new Date();
    if (!(stage.startAt <= now && stage.endAt >= now)) throw new BadRequestException('Stage is not active');
    const student = await this.studentRepo.findOne({ where: { userId: dto.student_id } });
    if (!student) throw new NotFoundException('Student not found');
    const sc = await this.subjComRepo.findOne({ where: { id: dto.subject_commission_id } });
    if (!sc) throw new NotFoundException('Subject commission not found');
    const exists = await this.enrollRepo.findOne({ where: { stageId: stage.id, studentId: student.userId, subjectCommissionId: sc.id } });
    if (exists) return exists;
    const row = this.enrollRepo.create({ stageId: stage.id, studentId: student.userId, subjectCommissionId: sc.id });
    return this.enrollRepo.save(row);
  }

  async unenroll(id: number) {
    const row = await this.enrollRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Enrollment not found');
    await this.enrollRepo.remove(row);
    return { deleted: true };
  }
}
