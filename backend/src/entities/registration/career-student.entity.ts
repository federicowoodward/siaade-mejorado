import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Career } from "./career.entity";
import { Student } from "@/entities/users/student.entity";

@Entity("career_students")
export class CareerStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "career_id", type: "int" })
  careerId: number;

  @ManyToOne(() => Career, { onDelete: "CASCADE" })
  @JoinColumn({ name: "career_id" })
  career: Career;

  @Column({ name: "student_id", type: "uuid" })
  studentId: string;

  @ManyToOne(() => Student, { eager: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "student_id", referencedColumnName: "userId" })
  student: Student;

  @Column({ name: "enrolled_at", type: "date", nullable: true })
  enrolledAt: Date | null;
}
