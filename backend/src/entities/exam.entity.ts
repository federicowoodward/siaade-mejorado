import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Subject } from './subject.entity';  // Importa la entidad Subject para la relación

@Entity()
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;  // El ID del examen

  @Column()
  title: string;  // Título del examen (por ejemplo, "Primer Parcial")

  @Column()
  date: Date;  // Fecha en la que se realiza el examen

  @ManyToOne(() => Subject, (subject) => subject.exams)
  subject: Subject;  // Relación con la entidad Subject (materia)
}