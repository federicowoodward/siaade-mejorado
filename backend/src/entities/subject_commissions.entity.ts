import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Subject } from './subjects.entity';
import { Commission } from './commission.entity';
import { Teacher } from './teachers.entity';

@Entity('subject_commissions')
@Index(['subjectId', 'commissionId'], { unique: true })
@Index(['subjectId'])
@Index(['teacherId'])
export class SubjectCommission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'subject_id', type: 'int' })
  subjectId: number;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'commission_id', type: 'int' })
  commissionId: number;

  @ManyToOne(() => Commission, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'commission_id' })
  commission: Commission;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @ManyToOne(() => Teacher, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teacher_id', referencedColumnName: 'userId' })
  teacher: Teacher;

  @Column({ name: 'active', type: 'bool', default: true })
  active: boolean;
}
