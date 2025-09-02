import { Controller, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { FinalExamsService } from './final-exams.service';  // Servicio de exámenes finales
import { FinalExam } from '../../../entities/final-exam.entity';  // Entidad de examen final
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../users/auth/roles.decorator';
import { HierarchyGuard } from '../../../guards/hierarchy.guard';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('exams/manage')
export class FinalExamsController {
  constructor(private readonly finalExamsService: FinalExamsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
  @Roles('ADMIN_GENERAL')  // Solo los usuarios con rol 'ADMIN_GENERAL' pueden crear exámenes
  async createExam(@Body() examData: FinalExam): Promise<FinalExam> {
    return this.finalExamsService.create(examData);  // Crear un nuevo examen final
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
  @Roles('ADMIN_GENERAL')  // Solo los usuarios con rol 'ADMIN_GENERAL' pueden actualizar exámenes
  async updateExam(@Param('id') id: string, @Body() examData: FinalExam): Promise<FinalExam | null> {
    return this.finalExamsService.update(parseInt(id), examData);  // Actualizar un examen final
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
  @Roles('ADMIN_GENERAL')  // Solo los usuarios con rol 'ADMIN_GENERAL' pueden eliminar exámenes
  async deleteExam(@Param('id') id: string): Promise<void> {
    return this.finalExamsService.delete(parseInt(id));  // Eliminar un examen final
  }
}