import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FinalExamsService } from './final-exams.service';
import { FinalExam } from '../../../entities/final-exam.entity';
import { RolesGuard } from '../../auth/roles.guard';  // Importa el RolesGuard
import { Roles } from '../../auth/roles.decorator';  // Importa el decorador para roles
import { JwtAuthGuard } from '../../auth/jwt.guard';  // Importa el AuthGuard

@Controller('exams/read')
export class FinalExamsController {
  constructor(private readonly finalExamsService: FinalExamsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los usuarios con rol 'ADMIN_GENERAL' o 'PRECEPTOR' consultar exámenes
  async getExamInfo(@Param('id') id: string): Promise<FinalExam> {
    return this.finalExamsService.getExamInfo(id);  // Consultar un examen por ID
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los usuarios con rol 'ADMIN_GENERAL' o 'PRECEPTOR' consultar todos los exámenes
  async getAllExams(): Promise<FinalExam[]> {
    return this.finalExamsService.getAllExams();  // Consultar todos los exámenes
  }
}