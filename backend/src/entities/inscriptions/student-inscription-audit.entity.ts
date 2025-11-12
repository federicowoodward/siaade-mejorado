import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("student_inscription_audits")
export class StudentInscriptionAudit {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "student_id", type: "uuid" })
  @Index("idx_sia_student")
  studentId!: string;

  @Column({ type: "text" })
  context!: string; // e.g., 'enroll-exam'

  @Column({ name: "mesa_id", type: "int", nullable: true })
  mesaId!: number | null;

  @Column({ name: "call_id", type: "int", nullable: true })
  callId!: number | null;

  @Column({ type: "text" })
  outcome!: "success" | "blocked" | "error";

  @Column({ name: "reason_code", type: "text", nullable: true })
  reasonCode!: string | null;

  @Column({ name: "subject_id", type: "int", nullable: true })
  subjectId!: number | null;

  @Column({ name: "subject_order_no", type: "int", nullable: true })
  subjectOrderNo!: number | null;

  @Column({ name: "subject_name", type: "text", nullable: true })
  subjectName!: string | null;

  @Column({ name: "missing_correlatives", type: "jsonb", nullable: true })
  missingCorrelatives!: string[] | null;

  @Column({ name: "ip", type: "text", nullable: true })
  ip!: string | null;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent!: string | null;
}
