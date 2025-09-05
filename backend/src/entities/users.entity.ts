import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { Role } from "./roles.entity";
import { UserInfo } from "./user_info.entity";
import { CommonData } from "./common_data.entity";
import { Student } from "./students.entity";
import { Teacher } from "./teachers.entity";
import { Preceptor } from "./preceptors.entity";
import { Secretary } from "./secretaries.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ name: "last_name", nullable: true })
  lastName: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ unique: true, nullable: true })
  cuil: string;

  @Column({ name: "role_id" })
  roleId: number;

  @ManyToOne(() => Role, (r) => r.users)
  @JoinColumn({ name: "role_id" })
  role: Role;

  @OneToOne(() => UserInfo, (ui) => ui.user)
  userInfo: UserInfo;

  @OneToOne(() => CommonData, (cd) => cd.user)
  commonData: CommonData;

  @OneToOne(() => Student, (s) => s.user)
  student: Student;

  @OneToOne(() => Teacher, (t) => t.user)
  teacher: Teacher;

  @OneToOne(() => Preceptor, (p) => p.user)
  preceptor: Preceptor;

  @OneToOne(() => Secretary, (s) => s.user)
  secretary: Secretary;
}
