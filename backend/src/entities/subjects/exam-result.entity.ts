import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Exam } from './exam.entity';
import { Student } from '@/entities/users/student.entity';

@Entity('exam_results')
export class ExamResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'exam_id' })
  examId: number;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, (s) => s.examResults, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'userId' })
  student: Student;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  score: string | null; // usar string para DECIMAL en JS
}
