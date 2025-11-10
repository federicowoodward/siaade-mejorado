import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { FinalExamService } from "@/modules/final_exams/services/final-exam.service";
import { CreateFinalExamDto } from "@/modules/final_exams/dto/final-exam.dto";
import { ApproveFinalDto, RecordFinalDto } from "@/modules/final_exams/dto/final-exam-admin.dto";
import { normalizePagination, buildPageMeta } from '@/shared/utils/pagination';

import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

class FinalExamDto {
  id!: number;
  exam_table_id!: number;
  subject_id!: number;
  exam_date!: string;
  exam_time?: string;
  aula?: string | null;
}

class FinalExamListItemDto {
  id!: number;
  subject_id!: number;
  subject_name!: string;
  exam_date!: string;
  aula?: string | null;
}

class DeletedResponseDto {
  deleted!: boolean;
}

@ApiTags("Finals / Exam")
@ApiBearerAuth()
@Controller("finals/exam")
export class FinalExamController {
  constructor(private readonly svc: FinalExamService) {}

  private mapExamEntity(entity: any): FinalExamDto {
    return {
      id: entity.id,
      exam_table_id: entity.examTableId ?? entity.exam_table_id,
      subject_id: entity.subjectId ?? entity.subject_id,
      exam_date: (entity.examDate ?? entity.exam_date)?.toISOString?.().slice(0, 10) ?? entity.exam_date,
      exam_time: (entity.examDate ?? entity.exam_date) instanceof Date
        ? String((entity.examDate as Date).toTimeString?.()?.slice(0,5) ?? '')
        : (entity.exam_time ?? undefined),
      aula: entity.aula ?? null,
    };
  }

  @ApiOperation({ summary: "Crear examen final dentro de una mesa" })
  @ApiBody({ type: CreateFinalExamDto })
  @ApiCreatedResponse({ type: FinalExamDto })
  @ApiBadRequestResponse({ description: "Fecha fuera de rango" })
  @ApiNotFoundResponse({
    description: "Exam table not found / Subject not found",
  })
  @Post("create")
  async create(@Body() dto: CreateFinalExamDto) {
    const saved = await this.svc.create(dto);
    return this.mapExamEntity(saved);
  }

  @ApiOperation({ summary: "Eliminar examen final" })
  @ApiParam({ name: "id", type: Number, required: true })
  @ApiOkResponse({ type: DeletedResponseDto })
  @ApiNotFoundResponse({ description: "Final exam not found" })
  @Delete("delete/:id")
  remove(@Param("id") id: string) {
    return this.svc.remove(+id);
  }

  @ApiOperation({ summary: "Listar examenes de una mesa (paginado por page/limit)" })
  @ApiParam({ name: "exam_table_id", type: Number, required: true })
  @ApiOkResponse({
    description: 'Lista paginada de examenes de una mesa',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              subject_id: { type: 'number' },
              subject_name: { type: 'string' },
              exam_date: { type: 'string' },
              aula: { type: 'string', nullable: true },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            pages: { type: 'number' },
          },
        },
      },
    } as any,
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get("list-all/:exam_table_id")
  listAll(
    @Param("exam_table_id") tableId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    return this.svc.listAllByTable(+tableId, { skip: offset, take: l }).then(([rows, total]) => ({ data: rows, meta: buildPageMeta(total, p, l) }));
  }

  @ApiOperation({ summary: "Obtener examen final por ID y sus estudiantes" })
  @ApiParam({ name: "final_exam_id", type: Number, required: true })
  @ApiOkResponse({ type: FinalExamDto })
  @ApiNotFoundResponse({ description: "Final exam not found" })
  @Get("list/:final_exam_id")
  getOne(@Param("final_exam_id") examId: string) {
    return this.svc.getOne(+examId);
  }

  @ApiOperation({ summary: "Registrar nota de final (estado: registrado)" })
  @ApiBody({ type: RecordFinalDto })
  @Post('record')
  record(@Body() dto: RecordFinalDto) {
    return this.svc.record(dto);
  }

  @ApiOperation({ summary: "Aprobacion administrativa del final (estado: aprobado_admin)" })
  @ApiBody({ type: ApproveFinalDto })
  @Post('approve')
  approve(@Body() dto: ApproveFinalDto) {
    return this.svc.approve(dto);
  }
}

