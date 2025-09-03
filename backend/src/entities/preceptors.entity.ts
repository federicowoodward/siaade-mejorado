import { Entity, PrimaryColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './users.entity';
import { Subject } from './subjects.entity';

@Entity('preceptors')
export class Preceptor {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (u) => u.preceptor, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Subject, (s) => s.preceptorRel)
  subjects: Subject[];
}
