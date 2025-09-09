import { Module } from '@nestjs/common';
import { FinalExamsService } from './final-exams.service';
import { FinalExamsController } from './final-exams.controller';
import { FinalExamsAliasController } from './final-exams.alias.controller';
import { ExamResultsAliasController } from './exam-results.alias.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinalExam } from '../../../entities/final_exam.entity';
import { FinalExamsStudent } from '../../../entities/final_exams_student.entity';
import { ExamResult } from '../../../entities/exam_result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FinalExam, FinalExamsStudent, ExamResult])],
  controllers: [FinalExamsController, FinalExamsAliasController, ExamResultsAliasController],
  providers: [FinalExamsService],
})
export class FinalExamsModule {}