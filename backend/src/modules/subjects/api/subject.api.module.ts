import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectApiService } from './subject.api.service';
import { SubjectApiController } from './subject.api.controller';
import { Subject } from '@/entities/subjects/subject.entity';
import { SubjectAbsence } from '@/entities/subjects/subject-absence.entity';
import { SubjectStudent } from '@/entities/subjects/subject-student.entity';
import { Exam } from '@/entities/subjects/exam.entity';
import { ExamResult } from '@/entities/subjects/exam-result.entity';
import { Student } from '@/entities/users/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject, SubjectAbsence, SubjectStudent, Exam, ExamResult, Student])
  ],
  controllers: [SubjectApiController],
  providers: [SubjectApiService],
})
export class SubjectApiModule {}


