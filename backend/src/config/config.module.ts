
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../entities/users.entity';
import { Subject } from '../entities/subjects.entity';
import { FinalExam } from '../entities/final-exam.entity';
import { Role } from '../entities/roles.entity';
import { Student } from '../entities/students.entity';
import { Exam } from '../entities/exams.entity';

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT', '5432'), 10),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [User, Subject, FinalExam, Role, Student, Exam],
        synchronize: false,
        logging: true,
      }),
    }),
  ],
})
export class ConfigModule {}