import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';  // Importa el servicio local de read
import { Subject } from '@/entities/subjects/subject.entity';  // Entidad de materia para el tipo de retorno
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../users/auth/roles.decorator';  // Decorador de roles original
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { normalizePagination, buildPageMeta } from '@/shared/utils/pagination';

@Controller('subjects/read')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT')
  async getSubjectInfo(@Param('id') id: string): Promise<Subject | null> {
    return this.subjectsService.getSubjectInfo(parseInt(id));
  }

  @Get()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllSubjects(@Query('page') page?: number, @Query('limit') limit?: number): Promise<any> {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.subjectsService.getAllSubjects({ skip: offset, take: l });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }
}

