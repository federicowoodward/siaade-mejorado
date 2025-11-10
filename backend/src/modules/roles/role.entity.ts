import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;  // ID único para cada rol

  @Column()
  name: string;  // Nombre del rol (ejemplo: 'ADMIN_GENERAL', 'SECRETARIO', 'ALUMNO')
}