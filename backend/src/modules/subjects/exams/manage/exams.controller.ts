import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service';  // Importa el servicio de exámenes
import { Exam } from '../../../../entities/exam.entity';  // Asegúrate de tener la entidad Exam
import { RolesGuard } from '../../../auth/roles.guard';  // Importa el RolesGuard
import { Roles } from '../../../auth/roles.decorator';  // Importa el decorador para roles
import { HierarchyGuard } from '../../../auth/hierarchy.guard';  // Importa el HierarchyGuard
import { JwtAuthGuard } from '../../../auth/jwt.guard';  // Importa el AuthGuard

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