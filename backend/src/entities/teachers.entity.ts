import { Entity, PrimaryColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './users.entity';
import { Subject } from './subjects.entity';

@Entity('teachers')
export class Teacher {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, (u) => u.teacher, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Subject, (s) => s.teacherRel)
  subjects: Subject[];
}
