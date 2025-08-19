import { Entity, PrimaryColumn, Column, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('students')
export class Student {
  @PrimaryColumn('uuid')
  userId: string;

  @Column({ unique: true, nullable: true })
  legajo: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}