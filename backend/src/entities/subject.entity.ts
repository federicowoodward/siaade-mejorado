import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'subject_name', nullable: true })
  subjectName: string;

  @Column({ type: 'uuid' })
  teacher: string;

  @Column({ type: 'uuid' })
  preceptor: string;

  @Column({ name: 'course_num', nullable: true })
  courseNum: number;

  @Column({ name: 'course_letter', nullable: true })
  courseLetter: string;

  @Column({ name: 'course_year', nullable: true })
  courseYear: string;

  @Column({ nullable: true })
  correlative: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher' })
  teacherUser: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'preceptor' })
  preceptorUser: User;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'correlative' })
  correlativeSubject: Subject;
}