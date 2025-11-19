import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Subject } from "./subject.entity";
import { Commission } from "@/entities/catalogs/commission.entity";
import { Teacher } from "@/entities/users/teacher.entity";

@Entity("subject_commissions")
@Index(["subjectId", "commissionId"], { unique: true })
@Index(["subjectId"])
@Index(["teacherId"])
export class SubjectCommission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "subject_id", type: "int" })
  subjectId: number;

  @ManyToOne(() => Subject, (s) => s.commissions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subject_id" })
  subject: Subject;

  @Column({ name: "commission_id", type: "int" })
  commissionId: number;

  @ManyToOne(() => Commission, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "commission_id" })
  commission: Commission;

  @Column({ name: "teacher_id", type: "uuid" })
  teacherId: string;

  @ManyToOne(() => Teacher, (t) => t.subjectCommissions, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "teacher_id", referencedColumnName: "userId" })
  teacher: Teacher;

  @Column({ name: "active", type: "boolean", default: true })
  active: boolean;

  @Column({
    name: "grade_window_opened_at",
    type: "timestamptz",
    nullable: true,
  })
  gradeWindowOpenedAt: Date | null;

  @Column({
    name: "grade_window_expires_at",
    type: "timestamptz",
    nullable: true,
  })
  gradeWindowExpiresAt: Date | null;
}
