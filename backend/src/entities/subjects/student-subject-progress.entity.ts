import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SubjectCommission } from './subject-commission.entity';
import { Student } from '@/entities/users/student.entity';
import { SubjectStatusType } from '@/entities/catalogs/subject-status-type.entity';

@Entity('student_subject_progress')
@Index(['subjectCommissionId', 'studentId'], { unique: true })
@Index(['studentId'])
export class StudentSubjectProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'subject_commission_id', type: 'int' })
  subjectCommissionId: number;

  @ManyToOne(() => SubjectCommission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_commission_id' })
  subjectCommission: SubjectCommission;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'userId' })
  student: Student;

  @Column({ name: 'status_id', type: 'int', nullable: true })
  statusId: number | null;

  @ManyToOne(() => SubjectStatusType, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'status_id' })
  status: SubjectStatusType | null;

  @Column({ name: 'partial_scores', type: 'jsonb', nullable: true })
  partialScores: Record<string, number> | null;

  @Column({ name: 'attendance_percentage', type: 'decimal', precision: 5, scale: 2, nullable: false, default: 0 })
  attendancePercentage: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
