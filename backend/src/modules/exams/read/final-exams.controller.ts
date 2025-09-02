import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FinalExamsService } from './final-exams.service';  // Servicio local de final-exams read
import { FinalExam } from '../../../entities/final-exam.entity';  // Entidad de examen final
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../users/auth/roles.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('exams/read')
export class FinalExamsController {
  constructor(private readonly finalExamsService: FinalExamsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los usuarios con rol 'ADMIN_GENERAL' o 'PRECEPTOR' consultar exámenes
  async getExamInfo(@Param('id') id: string): Promise<FinalExam | null> {
    return this.finalExamsService.getExamInfo(parseInt(id));  // Consultar un examen por ID
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los usuarios con rol 'ADMIN_GENERAL' o 'PRECEPTOR' consultar todos los exámenes
  async getAllExams(): Promise<FinalExam[]> {
    return this.finalExamsService.getAllExams();  // Consultar todos los exámenes
  }
}