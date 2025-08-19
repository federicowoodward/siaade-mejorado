import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Subject } from '../entities/subject.entity';
import { FinalExam } from '../entities/final-exam.entity';
import { Role } from '../entities/role.entity';
import { Student } from '../entities/student.entity';
import { Exam } from '../entities/exam.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'postgres',
      password: 'Joeldatabase*',
      database: 'dbsiaade',
      entities: [User, Subject, FinalExam, Role, Student, Exam],
      synchronize: false, // Como ya tenemos la DB creada, no sincronizamos
      logging: true, // Para debug
    }),
  ],
})
export class ConfigModule {}