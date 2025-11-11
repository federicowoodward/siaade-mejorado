import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from '@/entities/users/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, type: 'text' })
  name: string;

  @OneToMany(() => User, (u) => u.role)
  users?: User[];
}
