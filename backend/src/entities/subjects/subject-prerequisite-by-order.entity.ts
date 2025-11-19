import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "subject_prerequisites_by_order" })
@Index(["career_id", "subject_order_no", "prereq_order_no"], {
  unique: true,
  where: "",
})
@Index(["career_id", "prereq_order_no"])
@Index(["career_id", "subject_order_no"])
export class SubjectPrerequisiteByOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: false })
  career_id: number;

  @Column({ type: "int", nullable: false })
  subject_order_no: number;

  @Column({ type: "int", nullable: false })
  prereq_order_no: number;
}
