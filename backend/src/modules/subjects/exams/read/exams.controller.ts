import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service';  // Servicio local de exams read
import { Exam } from '@/entities/subjects/exam.entity';  // Entidad de examen
import { RolesGuard } from '../../../../guards/roles.guard';
import { Roles } from '../../../users/auth/roles.decorator';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';

@Controller('subjects/exams/read')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los roles ADMIN_GENERAL y PRECEPTOR acceder
  async getExamInfo(@Param('id') id: string): Promise<Exam | null> {
    return this.examsService.getExamInfo(parseInt(id));  // Consultar información de un examen por ID
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los roles ADMIN_GENERAL y PRECEPTOR acceder
  async getAllExams(): Promise<Exam[]> {
    return this.examsService.getAllExams();  // Listar todos los exámenes de una materia
  }
}


