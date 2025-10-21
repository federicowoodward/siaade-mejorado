import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service';  // Servicio de exámenes
import { Exam } from '@/entities/subjects/exam.entity';  // Entidad de examen
import { RolesGuard } from '../../../../guards/roles.guard';
import { Roles } from '../../../users/auth/roles.decorator';
import { HierarchyGuard } from '../../../../guards/hierarchy.guard';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';

@Controller('subjects/exams/manage')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)  // Protege la ruta con los guards
  @Roles('ADMIN_GENERAL', 'SECRETARIO')  // Solo los usuarios con rol 'ADMIN_GENERAL' o 'SECRETARIO' pueden crear exámenes
  async createExam(@Body() examData: Exam): Promise<Exam> {
    return this.examsService.create(examData);  // Crear un nuevo examen para una materia
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)  // Protege la ruta con los guards
  @Roles('ADMIN_GENERAL', 'SECRETARIO')  // Solo los usuarios con rol 'ADMIN_GENERAL' o 'SECRETARIO' pueden editar exámenes
  async updateExam(@Param('id') id: string, @Body() examData: Exam): Promise<Exam | null> {
    return this.examsService.update(parseInt(id), examData);  // Actualizar un examen para una materia
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)  // Protege la ruta con los guards
  @Roles('ADMIN_GENERAL', 'SECRETARIO')  // Solo los usuarios con rol 'ADMIN_GENERAL' o 'SECRETARIO' pueden eliminar exámenes
  async deleteExam(@Param('id') id: string): Promise<void> {
    return this.examsService.delete(id);  // Eliminar un examen de una materia
  }
}


