import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Notice } from "./notice.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";

@Entity("notice_commissions")
export class NoticeCommission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "notice_id", type: "int" })
  noticeId: number;

  @ManyToOne(() => Notice, (notice) => notice.noticeCommissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "notice_id" })
  notice: Notice;

  @Column({ name: "subject_commission_id", type: "int" })
  subjectCommissionId: number;

  @ManyToOne(() => SubjectCommission, { onDelete: "CASCADE" })
  @JoinColumn({ name: "subject_commission_id" })
  subjectCommission: SubjectCommission;
}
