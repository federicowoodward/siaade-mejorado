import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('subject_status_type')
export class SubjectStatusType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'status_name', type: 'text', unique: true })
  statusName: string;
}
