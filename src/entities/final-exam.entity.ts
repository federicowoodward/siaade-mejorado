import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class FinalExam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  subject_id: string;  // ID de la materia asociada al examen

  @Column()
  exam_date: Date;  // Fecha del examen
}