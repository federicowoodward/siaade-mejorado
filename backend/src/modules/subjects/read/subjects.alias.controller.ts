import { Controller, Get, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from '../../../entities/subjects.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../users/auth/roles.decorator';

@Controller('subjects')
export class SubjectsAliasController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT')
  async getAllSubjects(): Promise<Subject[]> {
    return this.subjectsService.getAllSubjects();
  }
}
