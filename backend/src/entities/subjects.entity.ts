import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Teacher } from './teachers.entity';
import { Preceptor } from './preceptors.entity';
import { SubjectStudent } from './subject_student.entity';
import { Exam } from './exams.entity';
import { SubjectAbsence } from './subject_absence.entity';
import { AcademicPeriod } from './academic_period.entity';

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

  // DBML sugiere TEXT; hoy es int en esquema actual. Mantener como está a nivel DB, pero dejamos compat aquí.
  @Column({ name: 'correlative', type: 'int', nullable: true })
  correlative: number | null;

  // Nuevos campos según DBML (opcionales para no romper):
  @Column({ name: 'academic_period_id', type: 'int', nullable: true, select: false })
  academicPeriodId: number | null;

  @ManyToOne(() => AcademicPeriod, { nullable: true })
  @JoinColumn({ name: 'academic_period_id', referencedColumnName: 'academicPeriodId' })
  academicPeriod?: AcademicPeriod | null;

  @Column({ name: 'order_no', type: 'int', nullable: true, select: false })
  orderNo: number | null;

  @Column({ name: 'teacher_formation', type: 'text', nullable: true, select: false })
  teacherFormation?: string | null;

  @Column({ name: 'subject_format', type: 'text', nullable: true, select: false })
  subjectFormat?: string | null;

  @Column({ name: 'annual_workload', type: 'text', nullable: true, select: false })
  annualWorkload?: string | null;

  @Column({ name: 'weekly_workload', type: 'text', nullable: true, select: false })
  weeklyWorkload?: string | null;

  @OneToMany(() => SubjectStudent, (ss) => ss.subject)
  subjectStudents: SubjectStudent[];

  @OneToMany(() => Exam, (e) => e.subject)
  exams: Exam[];

  @OneToMany(() => SubjectAbsence, (sa) => sa.subject)
  absences: SubjectAbsence[];
}
