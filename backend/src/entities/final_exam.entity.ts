import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Subject } from "./subjects.entity";
import { FinalExamsStudent } from "./final_exams_student.entity";
import { FinalExamTable } from "./final_exam_table.entity";
import { ExamTable } from "./exam_table.entity";

@Entity("final_exams")
export class FinalExam {
  @PrimaryGeneratedColumn()
  id: number;

  // Compat: final_exam_table_id (legacy) y exam_table_id (nuevo DBML)
  @Column({ name: "final_exam_table_id", type: "int", nullable: true, select: false })
  finalExamTableId: number | null;

  @ManyToOne(() => FinalExamTable, (et) => et.finals, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "final_exam_table_id" })
  finalExamTable?: FinalExamTable | null;

  @Column({ name: "exam_table_id", type: "int", nullable: true, select: false })
  examTableId: number | null;

  @ManyToOne(() => ExamTable, (et) => et.finals, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "exam_table_id" })
  examTable?: ExamTable | null;

  @Column({ name: "subject_id", type: "int" })
  subjectId: number;

  @ManyToOne(() => Subject, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subject_id" })
  subject: Subject;

  @Column({ name: "exam_date", type: "timestamptz" })
  examDate: Date;

  @Column({ name: "exam_time", type: "time", nullable: true })
  examTime: string | null;

  @Column({ nullable: true })
  aula: string;

  @OneToMany(() => FinalExamsStudent, (fes) => fes.finalExam)
  students: FinalExamsStudent[];
}
