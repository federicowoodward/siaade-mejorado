import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_info')
export class UserInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (u) => u.userInfo)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ name: 'emergency_name', type: 'text', nullable: true })
  emergencyName: string | null;

  @Column({ name: 'emergency_phone', type: 'text', nullable: true })
  emergencyPhone: string | null;
}
