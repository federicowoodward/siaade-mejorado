import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('secretaries')
export class Secretary {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (u) => u.secretary, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'is_directive', type: 'boolean', default: false })
  isDirective: boolean;
}
