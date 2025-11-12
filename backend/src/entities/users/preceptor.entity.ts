import { Entity, PrimaryColumn, OneToOne, JoinColumn, Column } from "typeorm";
import { User } from "./user.entity";

@Entity("preceptors")
export class Preceptor {
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId: string;

  @OneToOne(() => User, (u) => u.preceptor, { eager: true })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "can_login", type: "bool", nullable: true, default: true })
  canLogin: boolean | null;

  @Column({ name: "is_active", type: "bool", nullable: true, default: true })
  isActive: boolean | null;
}
