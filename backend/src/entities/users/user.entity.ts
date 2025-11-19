import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { Role } from "@/entities/roles/role.entity";
import { UserInfo } from "./user-info.entity";
import { CommonData } from "./common-data.entity";
import { Student } from "./student.entity";
import { Teacher } from "./teacher.entity";
import { Preceptor } from "./preceptor.entity";
import { Secretary } from "./secretary.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  name: string;

  @Column({ name: "last_name", type: "text" })
  lastName: string;

  @Column({ unique: true, type: "text" })
  email: string;

  @Column({ type: "text" })
  password: string;

  @Column({ unique: true, type: "text" })
  cuil: string;

  @Column({ name: "role_id", type: "int" })
  roleId: number;

  @ManyToOne(() => Role, (r) => r.users)
  @JoinColumn({ name: "role_id" })
  role: Role;

  @OneToOne(() => UserInfo, (ui) => ui.user)
  userInfo?: UserInfo;

  @OneToOne(() => CommonData, (cd) => cd.user)
  commonData?: CommonData;

  @OneToOne(() => Student, (s) => s.user)
  student?: Student;

  @OneToOne(() => Teacher, (t) => t.user)
  teacher?: Teacher;

  @OneToOne(() => Preceptor, (p) => p.user)
  preceptor?: Preceptor;

  @OneToOne(() => Secretary, (s) => s.user)
  secretary?: Secretary;

  // Bloqueo lógico transversal (no elimina la cuenta). Si isBlocked=true se puede limitar acciones (ej: inscripciones) y mostrar blockedReason.
  @Column({ name: "is_blocked", type: "bool", nullable: false, default: false })
  isBlocked: boolean;

  @Column({ name: "blocked_reason", type: "text", nullable: true })
  blockedReason: string | null;

  // Nuevo flag de actividad reversible (INACTIVO se comporta como borrado lógico para login y listados).
  // NOTA: Se añade vía migración posterior; si todavía no existe la columna, TypeORM la agregará.
  @Column({ name: "is_active", type: "bool", nullable: false, default: true })
  isActive: boolean;
}
