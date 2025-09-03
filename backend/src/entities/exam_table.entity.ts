import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Secretary } from './secretaries.entity';
import { FinalExam } from './final_exam.entity';

@Entity('exam_table')
export class ExamTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => Secretary, (s) => s.createdExamTables)
  @JoinColumn({ name: 'created_by', referencedColumnName: 'userId' })
  createdByRel: Secretary;

  @OneToMany(() => FinalExam, (fe) => fe.examTable)
  finals: FinalExam[];
}
