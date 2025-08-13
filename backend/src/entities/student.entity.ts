<<<<<<< HEAD
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Subject } from './subject.entity';  // Importa la entidad Subject para la relación

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;  // El ID del estudiante

  @Column()
  name: string;  // Nombre del estudiante

  @Column()
  email: string;  // Email del estudiante

  @ManyToMany(() => Subject)
  @JoinTable()
  subjects: Subject[];  // Relación de muchos a muchos con la entidad Subject (materias)
=======
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Subject } from './subject.entity';  // Importa la entidad Subject para la relación

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;  // El ID del estudiante

  @Column()
  name: string;  // Nombre del estudiante

  @Column()
  email: string;  // Email del estudiante

  @ManyToMany(() => Subject)
  @JoinTable()
  subjects: Subject[];  // Relación de muchos a muchos con la entidad Subject (materias)
>>>>>>> master
}