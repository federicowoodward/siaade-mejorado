import { Module } from '@nestjs/common';
import { FinalExamsService } from './final-exams.service';
import { FinalExamsController } from './final-exams.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinalExam } from '../../../entities/final-exam.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FinalExam])],
  controllers: [FinalExamsController],
  providers: [FinalExamsService],
})
export class FinalExamsModule {}