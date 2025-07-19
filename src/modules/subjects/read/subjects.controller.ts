import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from '../../../entities/subject.entity';  // Asegúrate de tener la entidad Subject
import { RolesGuard } from '../../auth/roles.guard';  // Asegúrate de importar el RolesGuard
import { Roles } from '../../auth/roles.decorator';  // Importa el decorador para roles
import { JwtAuthGuard } from '../../auth/jwt.guard';  // Importa el AuthGuard

@Controller('subjects/read')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRECEPTOR', 'ADMIN_GENERAL')
  async getSubjectInfo(@Param('id') id: string): Promise<Subject> {
    return this.subjectsService.getSubjectInfo(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRECEPTOR', 'ADMIN_GENERAL')
  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectsService.getAllSubjects();
  }
}