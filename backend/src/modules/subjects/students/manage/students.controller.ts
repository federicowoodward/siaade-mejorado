import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';  // Importa el servicio
import { Student } from '../../../../entities/student.entity';  // Entidad de estudiante
import { RolesGuard } from '../../../../guards/roles.guard';
import { Roles } from '../../../users/auth/roles.decorator';  // Decorador para roles
import { HierarchyGuard } from '../../../../guards/hierarchy.guard';
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';

@Controller('subjects/students/manage')  // Ruta para gestionar estudiantes
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('enroll')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)  // Aplica los guards
  @Roles('ADMIN_GENERAL', 'SECRETARIO')  // Solo los usuarios con estos roles pueden inscribir estudiantes
  async enrollStudent(@Body() studentData: Student): Promise<Student> {
    return this.studentsService.enroll(studentData);  // Inscribir un estudiante en una materia
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)  // Aplica los guards
  @Roles('ADMIN_GENERAL', 'SECRETARIO')  // Solo los usuarios con estos roles pueden actualizar estudiantes
  async updateStudent(@Param('id') id: string, @Body() studentData: Student): Promise<Student | null> {
    return this.studentsService.update(id, studentData);  // Actualizar los datos de un estudiante
  }

  @Delete('unenroll/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)  // Aplica los guards
  @Roles('ADMIN_GENERAL', 'SECRETARIO')  // Solo los usuarios con estos roles pueden desinscribir estudiantes
  async unenrollStudent(@Param('id') id: string): Promise<void> {
    return this.studentsService.unenroll(id);  // Eliminar la inscripción de un estudiante
  }
}