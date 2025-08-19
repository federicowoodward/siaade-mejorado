import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => User, user => user.role)
  users: User[];
}