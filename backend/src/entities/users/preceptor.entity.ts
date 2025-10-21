import { Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('preceptors')
export class Preceptor {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (u) => u.preceptor, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
