import { Entity, PrimaryColumn, OneToOne, JoinColumn, OneToMany, Column } from "typeorm";
import { User } from "./user.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";

@Entity("teachers")
export class Teacher {
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId: string;

  @OneToOne(() => User, (u) => u.teacher, { eager: true })
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => SubjectCommission, (sc) => sc.teacher)
  subjectCommissions?: SubjectCommission[];

  @Column({ name: "can_login", type: "bool", nullable: true, default: true })
  canLogin: boolean | null;

  @Column({ name: "is_active", type: "bool", nullable: true, default: true })
  isActive: boolean | null;
}
