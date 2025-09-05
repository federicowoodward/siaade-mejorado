import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ExamTable } from './exam_table.entity';
import { Subject } from './subjects.entity';
import { FinalExamsStudent } from './final_exams_student.entity';

@Entity('final_exams')
export class FinalExam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'exam_table_id', type: 'int' })
  examTableId: number;

  @ManyToOne(() => ExamTable, (et) => et.finals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_table_id' })
  examTable: ExamTable;

  @Column({ name: 'subject_id', type: 'int' })
  subjectId: number;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'exam_date', type: 'date' })
  examDate: Date;

  @Column({ nullable: true })
  aula: string;

  @OneToMany(() => FinalExamsStudent, (fes) => fes.finalExam)
  students: FinalExamsStudent[];
}
