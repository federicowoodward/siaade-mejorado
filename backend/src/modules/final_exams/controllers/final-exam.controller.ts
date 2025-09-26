import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { FinalExamService } from "../services/final-exam.service";
import { CreateFinalExamDto } from "../dto/final-exam.dto";

import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
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

  @ApiOperation({ summary: "Listar exámenes de una mesa" })
  @ApiParam({ name: "final_exam_table_id", type: Number, required: true })
  @ApiOkResponse({ type: FinalExamListItemDto, isArray: true })
  @Get("list-all/:final_exam_table_id")
  listAll(@Param("final_exam_table_id") tableId: string) {
    return this.svc.listAllByTable(+tableId);
  }

  @ApiOperation({ summary: "Obtener examen final por ID y sus estudiantes" })
  @ApiParam({ name: "final_exam_id", type: Number, required: true })
  @ApiOkResponse({ type: FinalExamDto })
  @ApiNotFoundResponse({ description: "Final exam not found" })
  @Get("list/:final_exam_id")
  getOne(@Param("final_exam_id") examId: string) {
    return this.svc.getOne(+examId);
  }
}
