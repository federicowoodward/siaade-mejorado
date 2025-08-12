import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { Exam } from '../../../entities/exam.entity';
import { RolesGuard } from '../../auth/roles.guard';  // Importa el RolesGuard
import { Roles } from '../../auth/roles.decorator';  // Importa el decorador para roles
import { JwtAuthGuard } from '../../auth/jwt.guard';  // Importa el AuthGuard

@Controller('subjects/exams/read')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los roles ADMIN_GENERAL y PRECEPTOR acceder
  async getExamInfo(@Param('id') id: string): Promise<Exam> {
    return this.examsService.getExamInfo(id);  // Consultar información de un examen por ID
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los roles ADMIN_GENERAL y PRECEPTOR acceder
  async getAllExams(): Promise<Exam[]> {
    return this.examsService.getAllExams();  // Listar todos los exámenes de una materia
  }
}