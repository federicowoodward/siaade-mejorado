import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamResult } from '../../../entities/exam_result.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../users/auth/roles.decorator';

@Controller('exam_results')
export class ExamResultsAliasController {
  constructor(
    @InjectRepository(ExamResult)
    private readonly repo: Repository<ExamResult>,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT')
  async getAll(): Promise<Array<{ id: number; examId: number; studentId: string; score: string | null }>> {
    // Devolver examId como subjectId para que el front pueda cruzar con subjects directamente
    const rows = await this.repo
      .createQueryBuilder('er')
      .leftJoin('er.exam', 'exam')
      .select([
        'er.id AS id',
        'exam.subject_id AS examId',
        'er.student_id AS studentId',
        'er.score AS score',
      ])
      .getRawMany();
    return rows.map((r) => ({
      id: Number(r.id),
      examId: Number(r.examId),
      studentId: r.studentId,
      score: r.score,
    }));
  }
}
