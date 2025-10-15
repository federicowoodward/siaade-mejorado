import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { normalizePagination, buildPageMeta } from '@/shared/utils/pagination';
import { CatalogsService } from './catalogs.service';

@ApiTags('Catalogs')
@ApiBearerAuth()
@Controller('catalogs')
export class CatalogsController {
  constructor(private readonly service: CatalogsService) {}

  @Get('academic-periods')
  @ApiOperation({ summary: 'Listar períodos académicos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAcademicPeriods(@Query('page') page?: number, @Query('limit') limit?: number) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.service.findAcademicPeriods({ skip: offset, take: l });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }

  @Get('careers')
  @ApiOperation({ summary: 'Listar carreras' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findCareers(@Query('page') page?: number, @Query('limit') limit?: number) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.service.findCareers({ skip: offset, take: l });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Listar comisiones' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findCommissions(@Query('page') page?: number, @Query('limit') limit?: number) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.service.findCommissions({ skip: offset, take: l });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }

  @Get('subject-commissions')
  @ApiOperation({ summary: 'Listar asignaturas por comisión' })
  @ApiQuery({ name: 'subjectId', required: false, type: Number })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findSubjectCommissions(
    @Query('subjectId') subjectId?: number,
    @Query('teacherId') teacherId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.service.findSubjectCommissions({ subjectId, teacherId }, { skip: offset, take: l });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }

  @Get('final-exam-status')
  @ApiOperation({ summary: 'Listar estados de finales' })
  async findFinalExamStatus() {
    const [rows, total] = await this.service.findFinalExamStatus();
    return { data: rows, meta: buildPageMeta(total, 1, total || 1) };
  }

  @Get('subject-status-types')
  @ApiOperation({ summary: 'Listar tipos de estado de materia' })
  async findSubjectStatusTypes() {
    const [rows, total] = await this.service.findSubjectStatusTypes();
    return { data: rows, meta: buildPageMeta(total, 1, total || 1) };
  }
}
