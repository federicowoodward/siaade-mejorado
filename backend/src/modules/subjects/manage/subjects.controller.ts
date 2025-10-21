import { Controller, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { Subject } from '@/entities/subjects/subject.entity';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../users/auth/roles.decorator';
import { HierarchyGuard } from '../../../guards/hierarchy.guard';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@ApiTags('Subjects')
@ApiBearerAuth()
@Controller('subjects/manage')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Secretario')
  async createSubject(@Body() subjectData: CreateSubjectDto): Promise<Subject> {
    return this.subjectsService.create(subjectData as Partial<Subject>);
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, HierarchyGuard)
  @Roles('Administrador', 'Secretario')
  async updateSubject(
    @Param('id') id: string,
    @Body() subjectData: Partial<CreateSubjectDto>,
  ): Promise<Subject | null> {
    return this.subjectsService.update(parseInt(id, 10), subjectData as Partial<Subject>);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrador', 'Secretario')
  async deleteSubject(@Param('id') id: string): Promise<void> {
    await this.subjectsService.delete(parseInt(id, 10));
  }
}


