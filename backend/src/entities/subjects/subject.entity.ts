import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { SubjectStudent } from "./subject-student.entity";
import { Exam } from "./exam.entity";
import { AcademicPeriod } from "@/entities/catalogs/academic-period.entity";
import { SubjectCommission } from "./subject-commission.entity";

@Entity("subjects")
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "subject_name", type: "text" })
  subjectName: string;

  @Column({ name: "academic_period_id", type: "int", nullable: true })
  academicPeriodId: number | null;

  @ManyToOne(() => AcademicPeriod, { nullable: true })
  @JoinColumn({
    name: "academic_period_id",
    referencedColumnName: "academicPeriodId",
  })
  academicPeriod?: AcademicPeriod | null;

  @Column({ name: "order_no", type: "int", nullable: true })
  orderNo: number | null;

  @Column({ name: "correlative", type: "text", nullable: true })
  correlative: string | null;

  @Column({ name: "teacher_formation", type: "text", nullable: true })
  teacherFormation?: string | null;

  @Column({ name: "subject_format", type: "text", nullable: true })
  subjectFormat?: string | null;

  @Column({ name: "annual_workload", type: "text", nullable: true })
  annualWorkload?: string | null;

  @Column({ name: "weekly_workload", type: "text", nullable: true })
  weeklyWorkload?: string | null;

  @OneToMany(() => SubjectCommission, (sc) => sc.subject)
  commissions?: SubjectCommission[];

  @OneToMany(() => SubjectStudent, (ss) => ss.subject)
  subjectStudents?: SubjectStudent[];

  @OneToMany(() => Exam, (e) => e.subject)
  exams?: Exam[];

}
