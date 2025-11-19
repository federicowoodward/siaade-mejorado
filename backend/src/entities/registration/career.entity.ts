import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { AcademicPeriod } from "@/entities/catalogs/academic-period.entity";
import { Preceptor } from "@/entities/users/preceptor.entity";

@Entity("careers")
export class Career {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "career_name", type: "text" })
  careerName: string;

  @Column({ name: "academic_period_id", type: "int" })
  academicPeriodId: number;

  @ManyToOne(() => AcademicPeriod, { eager: false })
  @JoinColumn({
    name: "academic_period_id",
    referencedColumnName: "academicPeriodId",
  })
  academicPeriod: AcademicPeriod;

  @Column({ name: "preceptor_id", type: "uuid" })
  preceptorId: string;

  @ManyToOne(() => Preceptor, { eager: false })
  @JoinColumn({ name: "preceptor_id", referencedColumnName: "userId" })
  preceptor: Preceptor;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
    default: () => "now()",
  })
  createdAt: Date;
}
