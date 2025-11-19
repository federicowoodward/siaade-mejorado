import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("subject_grade_audits")
export class SubjectGradeAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "subject_commission_id", type: "int" })
  subjectCommissionId: number;

  @Column({ name: "student_id", type: "uuid" })
  studentId: string;

  @Column({ name: "actor_id", type: "uuid" })
  actorId: string;

  @Column({ name: "actor_role", type: "text" })
  actorRole: string;

  @Column({ name: "payload", type: "jsonb" })
  payload: Record<string, unknown>;

  @Column({ name: "context", type: "text", nullable: true })
  context: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "now()",
  })
  createdAt: Date;
}
