import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { FinalExam } from './final_exam.entity';

@Entity('exam_table')
export class ExamTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @OneToMany(() => FinalExam, (fe) => fe.examTable)
  finals: FinalExam[];
}
