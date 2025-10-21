import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Career } from './career.entity';
import { Subject } from '@/entities/subjects/subject.entity';

@Entity('career_subjects')
@Index(['careerId', 'subjectId'], { unique: true })
@Index(['careerId', 'orderNo'], { unique: true })
@Index(['subjectId'])
export class CareerSubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'career_id', type: 'int' })
  careerId: number;

  @ManyToOne(() => Career, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'career_id' })
  career: Career;

  @Column({ name: 'subject_id', type: 'int' })
  subjectId: number;

  @ManyToOne(() => Subject, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'year_no', type: 'smallint', nullable: true })
  yearNo: number | null;

  @Column({ name: 'period_order', type: 'smallint', nullable: true })
  periodOrder: number | null;

  @Column({ name: 'order_no', type: 'int' })
  orderNo: number;
}

@Entity('subject_prerequisites_by_order')
@Index(['careerId', 'subjectOrderNo', 'prereqOrderNo'], { unique: true })
@Index(['careerId', 'subjectOrderNo'])
@Index(['careerId', 'prereqOrderNo'])
export class SubjectPrerequisiteByOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'career_id', type: 'int' })
  careerId: number;

  @ManyToOne(() => Career, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'career_id' })
  career: Career;

  @Column({ name: 'subject_order_no', type: 'int' })
  subjectOrderNo: number;

  @Column({ name: 'prereq_order_no', type: 'int' })
  prereqOrderNo: number;
}
