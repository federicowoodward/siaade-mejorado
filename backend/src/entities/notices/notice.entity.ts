import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Role } from "@/entities/roles/role.entity";
import { User } from "@/entities/users/user.entity";

@Entity("notices")
export class Notice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text", default: "" })
  title: string;

  @Column({ type: "text" })
  content: string;

  // Si es null => visible para TODOS
  @Column({ name: "visible_role_id", type: "int", nullable: true })
  visibleRoleId: number | null;

  @ManyToOne(() => Role, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "visible_role_id" })
  visibleRole?: Role | null;

  @Column({ name: "created_by", type: "uuid", nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by" })
  createdBy?: User | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
