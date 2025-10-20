import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
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

/** ---------- Swagger DTOs de respuesta ---------- */
class FinalExamDto {
  id!: number;
  finalExamTableId!: number; // = final_exam_table_id
  subjectId!: number; // = subject_id
  examDate!: string; // YYYY-MM-DD
  aula?: string | null;
}

class FinalExamListItemDto {
  id!: number;
  subject_id!: number;
  subject_name!: string;
  exam_date!: string; // YYYY-MM-DD
  aula?: string | null;
}

class DeletedResponseDto {
  deleted!: boolean;
}
/** ---------------------------------------------- */

@ApiTags("Finals / Exam")
@ApiBearerAuth()
@Controller("finals/exam")
export class FinalExamController {
  constructor(private readonly svc: FinalExamService) {}

  @ApiOperation({ summary: "Crear examen final dentro de una mesa" })
  @ApiBody({ type: CreateFinalExamDto })
  @ApiCreatedResponse({ type: FinalExamDto })
  @ApiBadRequestResponse({ description: "Fecha fuera de rango" })
  @ApiNotFoundResponse({
    description: "Final exam table not found / Subject not found",
  })
  @Post("create")
  create(@Body() dto: CreateFinalExamDto) {
    console.log("FinalExamController.create(): dto:", dto);
    return this.svc.create(dto);
  }

  @ApiOperation({ summary: "Eliminar examen final" })
  @ApiParam({ name: "id", type: Number, required: true })
  @ApiOkResponse({ type: DeletedResponseDto })
  @ApiNotFoundResponse({ description: "Final exam not found" })
  @Delete("delete/:id")
  remove(@Param("id") id: string) {
    return this.svc.remove(+id);
  }

  @ApiOperation({ summary: "Listar exámenes de una mesa (paginado por page/limit)" })
  @ApiParam({ name: "final_exam_table_id", type: Number, required: true })
  @ApiOkResponse({
    description: 'Lista paginada de exámenes de una mesa',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 10 },
              subject_id: { type: 'number', example: 3 },
              subject_name: { type: 'string', example: 'Matemática I' },
              exam_date: { type: 'string', example: '2025-07-10' },
              aula: { type: 'string', nullable: true, example: 'Aula 3' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 12 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            pages: { type: 'number', example: 2 },
          },
        },
      },
    },
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get("list-all/:final_exam_table_id")
  listAll(
    @Param("final_exam_table_id") tableId: string,
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

  @ApiOperation({ summary: "Aprobación administrativa del final (estado: aprobado_admin)" })
  @ApiBody({ type: ApproveFinalDto })
  @Post('approve')
  approve(@Body() dto: ApproveFinalDto) {
    return this.svc.approve(dto);
  }
}
