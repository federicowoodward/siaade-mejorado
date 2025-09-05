import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';  // Importa el servicio local de read
import { Subject } from '../../../entities/subjects.entity';  // Entidad de materia para el tipo de retorno
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../users/auth/roles.decorator';  // Decorador de roles original
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('subjects/read')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT')
  async getSubjectInfo(@Param('id') id: string): Promise<Subject | null> {
    return this.subjectsService.getSubjectInfo(parseInt(id));
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT')
  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectsService.getAllSubjects();
  }
}