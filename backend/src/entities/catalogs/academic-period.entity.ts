import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("academic_period")
export class AcademicPeriod {
  @PrimaryGeneratedColumn({ name: "academic_period_id" })
  academicPeriodId: number;

  @Column({ name: "period_name", type: "text" })
  periodName: string;

  @Column({ name: "partials_score_needed", type: "smallint" })
  partialsScoreNeeded: number; // CHECK (2,4) enforced at DB level
}
