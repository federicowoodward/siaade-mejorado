import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectApiService } from './subject.api.service';
import { SubjectApiController } from './subject.api.controller';
import { Subject } from '../../../entities/subjects.entity';
import { SubjectAbsence } from '../../../entities/subject_absence.entity';
import { SubjectStudent } from '../../../entities/subject_student.entity';
import { Exam } from '../../../entities/exams.entity';
import { ExamResult } from '../../../entities/exam_result.entity';
import { Student } from '../../../entities/students.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject, SubjectAbsence, SubjectStudent, Exam, ExamResult, Student])
  ],
  controllers: [SubjectApiController],
  providers: [SubjectApiService],
})
export class SubjectApiModule {}
