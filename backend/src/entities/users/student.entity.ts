import { Entity, PrimaryColumn, Column, OneToMany, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { SubjectStudent } from '@/entities/subjects/subject-student.entity';
import { ExamResult } from '@/entities/subjects/exam-result.entity';
import { SubjectAbsence } from '@/entities/subjects/subject-absence.entity';
import { FinalExamsStudent } from '@/entities/finals/final-exams-student.entity';
import { Commission } from '@/entities/catalogs/commission.entity';

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

  @Column({ name: 'legajo', type: 'text', unique: true })
  legajo: string;

  @Column({ name: 'commission', type: 'int', nullable: true })
  commissionId: number | null;

  @ManyToOne(() => Commission, { nullable: true })
  @JoinColumn({ name: 'commission' })
  commission?: Commission | null;

  @Column({ name: 'can_login', type: 'bool', nullable: true })
  canLogin: boolean | null;

  @Column({ name: 'is_active', type: 'bool', nullable: true })
  isActive: boolean | null;

  @Column({ name: 'student_start_year', type: 'smallint', nullable: true })
  studentStartYear: number | null; // CHECK enforced via migration
}

// Este export es para que la entidad sea detectada en la build.
export const __students_entity_marker = true;

