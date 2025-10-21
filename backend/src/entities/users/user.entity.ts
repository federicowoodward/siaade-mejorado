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
}
