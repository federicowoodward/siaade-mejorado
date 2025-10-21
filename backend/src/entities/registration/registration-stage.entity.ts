import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Career } from './career.entity';
import { Secretary } from '@/entities/users/secretary.entity';
import { SubjectCommission } from '@/entities/subjects/subject-commission.entity';
import { Student } from '@/entities/users/student.entity';

@Entity('registration_stage_type')
export class RegistrationStageType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  name: string; // "cursado_inicial" | "cursado_continuacion" | "final" | etc.
}

@Entity('registration_stage')
@Index(['careerId', 'typeId'])
export class RegistrationStage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'career_id', type: 'int' })
  careerId: number;
  @ManyToOne(() => Career, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'career_id' })
  career: Career;

  @Column({ name: 'type_id', type: 'int' })
  typeId: number;
  @ManyToOne(() => RegistrationStageType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'type_id' })
  type: RegistrationStageType;

  @Column({ name: 'period_label', type: 'text', nullable: true })
  periodLabel: string | null;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdById: string;
  @ManyToOne(() => Secretary, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by', referencedColumnName: 'userId' })
  createdBy: Secretary;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'min_order_no', type: 'int', nullable: true })
  minOrderNo: number | null;

  @Column({ name: 'max_order_no', type: 'int', nullable: true })
  maxOrderNo: number | null;
}

@Entity('registration_enrollment')
@Index(['stageId', 'studentId', 'subjectCommissionId'], { unique: true })
@Index(['studentId'])
@Index(['subjectCommissionId'])
export class RegistrationEnrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'stage_id', type: 'int' })
  stageId: number;
  @ManyToOne(() => RegistrationStage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stage_id' })
  stage: RegistrationStage;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;
  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'userId' })
  student: Student;

  @Column({ name: 'subject_commission_id', type: 'int' })
  subjectCommissionId: number;
  @ManyToOne(() => SubjectCommission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_commission_id' })
  subjectCommission: SubjectCommission;

  @Column({ name: 'enrolled_at', type: 'timestamptz', default: () => 'now()' })
  enrolledAt: Date;
}
