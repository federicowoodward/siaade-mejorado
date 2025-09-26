import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { FinalExam } from "./final_exam.entity";
import { User } from "./users.entity";

@Entity("final_exam_table")
export class FinalExamTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: "start_date", type: "date" })
  startDate: Date;

  @Column({ name: "end_date", type: "date" })
  endDate: Date;

  @Column({ name: "created_by", type: "uuid" })
  createdBy: string;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: "created_by", referencedColumnName: "id" })
  createdByUser?: User | null;

  @OneToMany(() => FinalExam, (fe) => fe.finalExamTable)
  finals: FinalExam[];
}
