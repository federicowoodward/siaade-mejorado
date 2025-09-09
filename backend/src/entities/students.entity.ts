import { Entity, PrimaryColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { User } from './users.entity';
import { SubjectStudent } from './subject_student.entity';
import { ExamResult } from './exam_result.entity';
import { SubjectAbsence } from './subject_absence.entity';
import { FinalExamsStudent } from './final_exams_student.entity';

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
}
