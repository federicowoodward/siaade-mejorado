import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { Student } from '../../../entities/student.entity';  // Asegúrate de tener la entidad Student
import { RolesGuard } from '../../auth/roles.guard';  // Importa el RolesGuard
import { Roles } from '../../auth/roles.decorator';  // Importa el decorador para roles
import { JwtAuthGuard } from '../../auth/jwt.guard';  // Importa el AuthGuard

@Controller('subjects/students/read')  // Ruta para leer la información de los estudiantes
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)  // Protege la ruta con los guards
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los usuarios con estos roles consultar estudiantes
  async getStudentInfo(@Param('id') id: string): Promise<Student> {
    return this.studentsService.getStudentInfo(id);  // Consultar información de un estudiante por su ID
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)  // Protege la ruta con los guards
  @Roles('ADMIN_GENERAL', 'PRECEPTOR')  // Permite a los usuarios con estos roles consultar todos los estudiantes
  async getAllStudents(): Promise<Student[]> {
    return this.studentsService.getAllStudents();  // Consultar todos los estudiantes
  }
}