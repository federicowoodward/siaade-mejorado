import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RegistrationService } from '@/modules/registration/registration.service';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsBooleanString, IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { normalizePagination, buildPageMeta } from '@/shared/utils/pagination';

class CreateStageDto {
  @IsInt() career_id!: number;
  @IsInt() type_id!: number;
  @IsOptional() @IsString() period_label?: string;
  @IsDateString() start_at!: string;
  @IsDateString() end_at!: string;
  @IsUUID() created_by!: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) min_order_no?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) max_order_no?: number;
}

class EditStageDto {
  @IsOptional() @IsString() period_label?: string;
  @IsOptional() @IsDateString() start_at?: string;
  @IsOptional() @IsDateString() end_at?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) min_order_no?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) max_order_no?: number;
}

class EnrollDto {
  @IsInt() stage_id!: number;
  @IsUUID() student_id!: string;
  @IsInt() subject_commission_id!: number;
}

@ApiTags('Registration')
@ApiBearerAuth()
@Controller('registration')
export class RegistrationController {
  constructor(private readonly svc: RegistrationService) {}

  @ApiOperation({ summary: 'Listar tipos de etapas' })
  @Get('types')
  listTypes() {
    return this.svc.listTypes();
  }

  @ApiOperation({ summary: 'Listar etapas por carrera' })
  @ApiQuery({ name: 'career_id', required: true, type: Number })
  @ApiQuery({ name: 'active_only', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('stages')
  async listStages(
    @Query('career_id') careerId: string,
    @Query('active_only') activeOnly?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.svc.listStages(+careerId, activeOnly === 'true', { skip: offset, take: l });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }

  @ApiOperation({ summary: 'Crear etapa' })
  @ApiBody({ type: CreateStageDto })
  @Post('stages')
  createStage(@Body() dto: CreateStageDto) { return this.svc.createStage(dto); }

  @ApiOperation({ summary: 'Editar etapa' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: EditStageDto })
  @Put('stages/:id')
  editStage(@Param('id') id: string, @Body() dto: EditStageDto) { return this.svc.editStage(+id, dto); }

  @ApiOperation({ summary: 'Cerrar etapa (end_at = now)' })
  @ApiParam({ name: 'id', type: Number })
  @Post('stages/:id/close')
  closeStage(@Param('id') id: string) { return this.svc.closeStage(+id); }

  @ApiOperation({ summary: 'Inscribir alumno' })
  @ApiBody({ type: EnrollDto })
  @Post('enroll')
  enroll(@Body() dto: EnrollDto) { return this.svc.enroll(dto); }

  @ApiOperation({ summary: 'Cancelar inscripción' })
  @ApiParam({ name: 'id', type: Number })
  @Delete('enroll/:id')
  unenroll(@Param('id') id: string) { return this.svc.unenroll(+id); }
}
