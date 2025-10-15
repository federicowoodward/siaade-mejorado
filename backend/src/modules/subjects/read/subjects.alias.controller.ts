import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { Subject } from '../../../entities/subjects.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../users/auth/roles.decorator';
import { normalizePagination, buildPageMeta } from '@/shared/utils/pagination';

@Controller('subjects')
export class SubjectsAliasController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRECEPTOR', 'ADMIN_GENERAL', 'SECRETARIO', 'TEACHER', 'STUDENT')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllSubjects(@Query('page') page?: number, @Query('limit') limit?: number): Promise<any> {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.subjectsService.getAllSubjects({ skip: offset, take: l });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }
}
