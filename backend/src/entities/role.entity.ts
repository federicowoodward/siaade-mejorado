import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;  // Nombre del rol (por ejemplo, 'ADMIN_GENERAL', 'SECRETARIO')

  @OneToMany(() => User, user => user.role)
  users: User[];  // Relación con la entidad User
}