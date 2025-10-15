import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FinalExam } from './final_exam.entity';
import { Student } from './students.entity';
import { FinalExamStatus } from './final_exam_status.entity';
import { Teacher } from './teachers.entity';
import { Secretary } from './secretaries.entity';

@Entity('final_exams_students')
@Index(['finalExamId', 'studentId'], { unique: true })
export class FinalExamsStudent {
  @PrimaryGeneratedColumn()
  id: number;

  // FK nueva consolidada
  @Column({ name: 'final_exam_id', type: 'int' })
  finalExamId: number;

  @ManyToOne(() => FinalExam, (fe) => fe.students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'final_exam_id' })
  finalExam: FinalExam;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, (s) => s.finals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'userId' })
  student: Student;

  @Column({ name: 'enrolled_at', type: 'timestamptz', nullable: true })
  enrolledAt: Date | null;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  score: string | null;

  @Column({ nullable: true })
  notes: string;

  // Nuevos campos de estado/registro/validación
  @Column({ name: 'status_id', type: 'int', nullable: true, select: false })
  statusId: number | null;

  @ManyToOne(() => FinalExamStatus, (s) => s.finals, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'status_id' })
  status?: FinalExamStatus | null;

  @Column({ name: 'recorded_by', type: 'uuid', nullable: true, select: false })
  recordedById: string | null;
  @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recorded_by', referencedColumnName: 'userId' })
  recordedBy?: Teacher | null;

  @Column({ name: 'recorded_at', type: 'timestamptz', nullable: true, select: false })
  recordedAt: Date | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true, select: false })
  approvedById: string | null;
  @ManyToOne(() => Secretary, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by', referencedColumnName: 'userId' })
  approvedBy?: Secretary | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true, select: false })
  approvedAt: Date | null;

  // (legacy retirado por migración)
}
