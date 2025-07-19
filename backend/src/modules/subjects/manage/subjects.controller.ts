import { Controller, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from '../../../entities/subject.entity';  // Asegúrate de tener la entidad Subject
import { RolesGuard } from '../../auth/roles.guard';  // Asegúrate de importar el RolesGuard
import { Roles } from '../../auth/roles.decorator';  // Importa el decorador para roles
import { HierarchyGuard } from '../../auth/hierarchy.guard';  // Importa el HierarchyGuard
import { JwtAuthGuard } from '../../auth/jwt.guard';  // Importa el AuthGuard

@Controller('subjects/manage')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
  @Roles('ADMIN_GENERAL', 'SECRETARIO')
  async createSubject(@Body() subjectData: Subject): Promise<Subject> {
    return this.subjectsService.create(subjectData);
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
  @Roles('ADMIN_GENERAL', 'SECRETARIO')
  async updateSubject(@Param('id') id: string, @Body() subjectData: Subject): Promise<Subject> {
    return this.subjectsService.update(id, subjectData);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
  @Roles('ADMIN_GENERAL', 'SECRETARIO')
  async deleteSubject(@Param('id') id: string): Promise<void> {
    return this.subjectsService.delete(id);
  }
}