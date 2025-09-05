import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Teacher } from './teachers.entity';
import { Preceptor } from './preceptors.entity';
import { SubjectStudent } from './subject_student.entity';
import { Exam } from './exams.entity';
import { SubjectAbsence } from './subject_absence.entity';

@Entity('subjects')
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'subject_name' })
  subjectName: string;

  // FK a teachers.user_id (uuid)
  @Column({ type: 'uuid' })
  teacher: string;

  @ManyToOne(() => Teacher, (t) => t.subjects, { eager: false })
  @JoinColumn({ name: 'teacher' })
  teacherRel: Teacher;

  // FK a preceptors.user_id (uuid)
  @Column({ type: 'uuid' })
  preceptor: string;

  @ManyToOne(() => Preceptor, (p) => p.subjects, { eager: false })
  @JoinColumn({ name: 'preceptor' })
  preceptorRel: Preceptor;

  @Column({ name: 'course_num', type: 'int', nullable: true })
  courseNum: number;

  @Column({ name: 'course_letter', type: 'text', nullable: true })
  courseLetter: string;

  @Column({ name: 'course_year', type: 'text', nullable: true })
  courseYear: string;

  @Column({ name: 'correlative', type: 'int', nullable: true })
  correlative: number | null;

  @OneToMany(() => SubjectStudent, (ss) => ss.subject)
  subjectStudents: SubjectStudent[];

  @OneToMany(() => Exam, (e) => e.subject)
  exams: Exam[];

  @OneToMany(() => SubjectAbsence, (sa) => sa.subject)
  absences: SubjectAbsence[];
}
