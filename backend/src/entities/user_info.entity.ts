import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './users.entity';

@Entity('user_info')
export class UserInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (u) => u.userInfo)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'document_type', nullable: true }) documentType: string;
  @Column({ name: 'document_value', nullable: true }) documentValue: string;
  @Column({ nullable: true }) phone: string;
  @Column({ name: 'emergency_name', nullable: true }) emergencyName: string;
  @Column({ name: 'emergency_phone', nullable: true }) emergencyPhone: string;
}
