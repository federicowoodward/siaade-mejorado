import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Subject } from "./subjects.entity";
import { FinalExamsStudent } from "./final_exams_student.entity";
import { FinalExamTable } from "./final_exam_table.entity";

@Entity("final_exams")
export class FinalExam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "final_exam_table_id", type: "int" })
  finalExamTableId: number;

  @ManyToOne(() => FinalExamTable, (et) => et.finals, { onDelete: "CASCADE" })
  @JoinColumn({ name: "final_exam_table_id" })
  finalExamTable: FinalExamTable;

  @Column({ name: "subject_id", type: "int" })
  subjectId: number;

  @ManyToOne(() => Subject, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subject_id" })
  subject: Subject;

  @Column({ name: "exam_date", type: "date" })
  examDate: Date;

  @Column({ name: "exam_time", type: "time", nullable: true })
  examTime: string | null;

  @Column({ nullable: true })
  aula: string;

  @OneToMany(() => FinalExamsStudent, (fes) => fes.finalExam)
  students: FinalExamsStudent[];
}
