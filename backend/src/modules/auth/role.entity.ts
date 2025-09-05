// src/modules/auth/role.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '../../entities/users.entity';  // Relaciona el rol con la entidad User

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;  // El nombre del rol (ejemplo: 'ADMIN_GENERAL', 'SECRETARIO', 'ALUMNO')

  @OneToMany(() => User, user => user.role)
  users: User[];  // Relación uno a muchos con los usuarios
}