import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Subject } from './subjects.entity';

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'subject_id' })
  subjectId: number;

  @ManyToOne(() => Subject, (s) => s.exams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'date', nullable: true })
  date: Date;

  @Column({ name: 'is_valid', default: true })
  isValid: boolean;
}
