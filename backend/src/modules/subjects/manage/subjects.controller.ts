import { Controller, Post, Body, Put, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from '../../../entities/subject.entity';  // Asegúrate de tener la entidad Subject
import { CreateSubjectDto } from './create-subject.dto';
import { RolesGuard } from '../../auth/roles.guard';  // Asegúrate de importar el RolesGuard
import { Roles } from '../../auth/roles.decorator';  // Importa el decorador para roles
import { HierarchyGuard } from '../../auth/hierarchy.guard';  // Importa el HierarchyGuard
import { JwtAuthGuard } from '../../auth/jwt.guard';  // Importa el AuthGuard

@Controller('subjects/manage')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Secretario')
  async createSubject(@Body() subjectData: CreateSubjectDto): Promise<Subject> {
    return this.subjectsService.create(subjectData as any);
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
  @Roles('Administrador', 'Secretario')
  async updateSubject(@Param('id') id: string, @Body() subjectData: Subject): Promise<Subject | null> {
    return this.subjectsService.update(parseInt(id), subjectData);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Secretario')
  async deleteSubject(@Param('id') id: string): Promise<void> {
    return this.subjectsService.delete(parseInt(id));
  }
}