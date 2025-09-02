import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';  // Importa el servicio local de read
import { Subject } from '../../../entities/subject.entity';  // Entidad de materia para el tipo de retorno
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../users/auth/roles.decorator';  // Importa el decorador para roles
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('subjects/read')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Preceptor', 'Administrador', 'Secretario', 'Profesor')
  async getSubjectInfo(@Param('id') id: string): Promise<Subject | null> {
    return this.subjectsService.getSubjectInfo(parseInt(id));
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Preceptor', 'Administrador', 'Secretario', 'Profesor')
  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectsService.getAllSubjects();
  }
}