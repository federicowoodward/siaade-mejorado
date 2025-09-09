import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinalExam } from '../../../entities/final_exam.entity';
import { FinalExamsStudent } from '../../../entities/final_exams_student.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../users/auth/roles.decorator';

@Controller()
export class FinalExamsAliasController {
  constructor(
    @InjectRepository(FinalExam)
    private finalExamsRepo: Repository<FinalExam>,
    @InjectRepository(FinalExamsStudent)
    private finalsStudentsRepo: Repository<FinalExamsStudent>,
  ) {}

  @Get('final_exams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT')
  async getAllFinalExams(): Promise<FinalExam[]> {
    return this.finalExamsRepo.find();
  }

  @Get('final_exams_students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT')
  async getAllFinalExamsStudents(): Promise<FinalExamsStudent[]> {
    return this.finalsStudentsRepo.find();
  }
}
