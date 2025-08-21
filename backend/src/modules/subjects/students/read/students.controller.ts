import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';  // Servicio local de students read
import { Student } from '../../../../entities/student.entity';  // Entidad de estudiante
import { RolesGuard } from '../../../../guards/roles.guard';
import { Roles } from '../../../users/auth/roles.decorator';  // Decorador para roles
import { JwtAuthGuard } from '../../../../guards/jwt-auth.guard';

@Controller('subjects/students/read')  // Ruta para leer la información de los estudiantes
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)  // Protege la ruta con los guards
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los usuarios con estos roles consultar estudiantes
  async getStudentInfo(@Param('id') id: string): Promise<Student | null> {
    return this.studentsService.getStudentInfo(id);  // Consultar información de un estudiante por su ID
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)  // Protege la ruta con los guards
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los usuarios con estos roles consultar todos los estudiantes
  async getAllStudents(): Promise<Student[]> {
    return this.studentsService.getAllStudents();  // Consultar todos los estudiantes
  }
}