import { Entity, PrimaryColumn, Column, OneToMany, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './users.entity';
import { SubjectStudent } from './subject_student.entity';
import { ExamResult } from './exam_result.entity';
import { SubjectAbsence } from './subject_absence.entity';
import { FinalExamsStudent } from './final_exams_student.entity';
import { Commission } from './commission.entity';

@Entity('students')
export class Student {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (u) => u.student, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => SubjectStudent, (ss) => ss.student)
  subjectStudents: SubjectStudent[];

  @OneToMany(() => ExamResult, (er) => er.student)
  examResults: ExamResult[];

  @OneToMany(() => SubjectAbsence, (sa) => sa.student)
  subjectAbsences: SubjectAbsence[];

  @OneToMany(() => FinalExamsStudent, (fes) => fes.student)
  finals: FinalExamsStudent[];

  // Nuevos campos del DBML
  @Column({ name: 'legajo', type: 'text', unique: true, nullable: true, select: false })
  legajo: string | null;

  @Column({ name: 'commission', type: 'int', nullable: true, select: false })
  commissionId: number | null;

  @ManyToOne(() => Commission, { nullable: true })
  @JoinColumn({ name: 'commission' })
  commission?: Commission | null;

  @Column({ name: 'can_login', type: 'bool', nullable: true, select: false })
  canLogin: boolean | null;

  @Column({ name: 'is_active', type: 'bool', nullable: true, select: false })
  isActive: boolean | null;

  @Column({ name: 'student_start_year', type: 'smallint', nullable: true, select: false })
  studentStartYear: number | null; // CHECK via migración
}

// Este export es para que la entidad sea detectada en la build.
export const __students_entity_marker = true;