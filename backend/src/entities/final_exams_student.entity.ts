import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { FinalExam } from './final_exam.entity';
import { Student } from './students.entity';

@Entity('final_exams_students')
export class FinalExamsStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'final_exams_id', type: 'int' })
  finalExamsId: number;

  @ManyToOne(() => FinalExam, (fe) => fe.students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'final_exams_id' })
  finalExam: FinalExam;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, (s) => s.finals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'userId' })
  student: Student;

  @Column({ name: 'enrolled_at', type: 'date', nullable: true })
  enrolledAt: Date | null;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  score: string | null;

  @Column({ nullable: true })
  notes: string;
}
