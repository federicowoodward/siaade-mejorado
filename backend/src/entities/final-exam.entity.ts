import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Subject } from './subject.entity';

@Entity('final_exams')
export class FinalExam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'exam_table_id' })
  examTableId: number;

  @Column({ name: 'subject_id' })
  subjectId: number;

  @Column({ name: 'exam_date', type: 'date' })
  examDate: Date;

  @Column({ nullable: true })
  aula: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;
}