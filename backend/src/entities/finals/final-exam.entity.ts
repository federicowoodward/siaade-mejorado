import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Subject } from "@/entities/subjects/subject.entity";
import { FinalExamsStudent } from "./final-exams-student.entity";
import { ExamTable } from "./exam-table.entity";

@Entity("final_exams")
export class FinalExam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "exam_table_id", type: "int" })
  examTableId: number;

  @ManyToOne(() => ExamTable, (et) => et.finalExams, { onDelete: "CASCADE" })
  @JoinColumn({ name: "exam_table_id" })
  examTable: ExamTable;

  @Column({ name: "subject_id", type: "int" })
  subjectId: number;

  @ManyToOne(() => Subject, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subject_id" })
  subject: Subject;

  @Column({ name: "exam_date", type: "timestamptz" })
  examDate: Date;

  @Column({ name: "aula", type: "text", nullable: true })
  aula: string | null;

  @OneToMany(() => FinalExamsStudent, (fes) => fes.finalExam)
  students?: FinalExamsStudent[];
}
