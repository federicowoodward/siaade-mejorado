import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { FinalExamsStudent } from './final_exams_student.entity';

@Entity('final_exam_status')
export class FinalExamStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  name: string; // registrado | aprobado_admin | anulado

  @OneToMany(() => FinalExamsStudent, (fes) => fes.status)
  finals: FinalExamsStudent[];
}
