import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "@/entities/users/user.entity";

@Entity("ui_alert_audits")
export class UiAlertAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user?: User | null;

  @Column({ name: "severity", type: "text" })
  severity: string;

  @Column({ name: "message", type: "text" })
  message: string;

  @Column({ name: "front_route", type: "text", nullable: true })
  frontRoute: string | null;

  @Column({ name: "front_module", type: "text", nullable: true })
  frontModule: string | null;

  @Column({ name: "action", type: "text", nullable: true })
  action: string | null;

  @Column({ name: "metadata", type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "now()",
  })
  createdAt: Date;
}
