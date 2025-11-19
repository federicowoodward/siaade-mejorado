import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Subject } from "./subject.entity";
import { Student } from "@/entities/users/student.entity";
import { SubjectCommission } from "./subject-commission.entity";

type SubjectEnrollmentActor = "student" | "preceptor" | "system";

@Entity("subject_students")
@Unique(["subjectId", "studentId"])
export class SubjectStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "subject_id" })
  subjectId: number;

  @ManyToOne(() => Subject, (s) => s.subjectStudents, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subject_id" })
  subject: Subject;

  @Column({ name: "student_id", type: "uuid" })
  studentId: string;

  @ManyToOne(() => Student, (s) => s.subjectStudents, { onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id", referencedColumnName: "userId" })
  student: Student;

  @Column({ name: "commission_id", type: "int", nullable: true })
  commissionId: number | null;

  @ManyToOne(() => SubjectCommission, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "commission_id" })
  commission?: SubjectCommission | null;

  @Column({ name: "enrollment_date", type: "date", nullable: true })
  enrollmentDate: Date | null;

  @Column({ name: "enrolled_by", type: "text", nullable: true })
  enrolledBy: SubjectEnrollmentActor | null;
}
