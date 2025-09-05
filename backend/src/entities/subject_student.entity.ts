import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Subject } from './subjects.entity';
import { Student } from './students.entity';

@Entity('subject_students')
@Unique(['subjectId', 'studentId'])
export class SubjectStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'subject_id' })
  subjectId: number;

  @ManyToOne(() => Subject, (s) => s.subjectStudents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, (s) => s.subjectStudents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id', referencedColumnName: 'userId' })
  student: Student;

  @Column({ name: 'enrollment_date', type: 'date', nullable: true })
  enrollmentDate: Date | null;
}
