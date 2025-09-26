import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './users.entity';
import { FinalExamTable } from './final_exam_table.entity';

@Entity('secretaries')
export class Secretary {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (u) => u.secretary, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'is_directive', default: false })
  isDirective: boolean;

}
