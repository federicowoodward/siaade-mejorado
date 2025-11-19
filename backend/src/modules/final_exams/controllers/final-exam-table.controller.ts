import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { FinalExamTableService } from "../services/final-exam-table.service";
import {
  InitFinalExamTableDto,
  EditFinalExamTableDto,
} from "../dto/final-exam-table.dto";

import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";

class ExamTableWindowDto {
  label!: string;
  opensAt!: string | null;
  closesAt!: string | null;
  state!: "open" | "upcoming" | "past" | "closed";
  message!: string | null;
}

class ExamTableVisibilityDto {
  students!: boolean;
  staff!: boolean;
}

class ExamTableQuotaDto {
  max!: number | null;
  used!: number | null;
}

class ExamTableCreatorDto {
  id!: string;
  name?: string | null;
  last_name?: string | null;
  lastName?: string | null;
  email?: string | null;
}

class ExamTableResponseDto {
  id!: number;
  name!: string;
  start_date!: string | null;
  end_date!: string | null;
  startDate?: string | null;
  endDate?: string | null;
  window_state!: "open" | "upcoming" | "past" | "closed";
  window!: ExamTableWindowDto;
  visibility!: ExamTableVisibilityDto;
  quota!: ExamTableQuotaDto;
  created_by!: string | null;
  createdByUser?: ExamTableCreatorDto;
}

class DeletedResponseDto {
  deleted!: boolean;
}

@ApiTags("Finals / Exam Table")
@ApiBearerAuth()
@Controller("finals/exam-table")
export class FinalExamTableController {
  constructor(private readonly svc: FinalExamTableService) {}

  @ApiOperation({ summary: "Crear mesa de examen" })
  @ApiBody({ type: InitFinalExamTableDto })
  @ApiCreatedResponse({
    type: ExamTableResponseDto,
    description: "Mesa creada",
  })
  @ApiBadRequestResponse({ description: "start_date must be <= end_date" })
  @Post("init")
  create(@Body() dto: InitFinalExamTableDto) {
    return this.svc.init(dto);
  }

  @ApiOperation({ summary: "Editar mesa de examen" })
  @ApiParam({ name: "id", type: Number, required: true })
  @ApiBody({ type: EditFinalExamTableDto })
  @ApiOkResponse({ type: ExamTableResponseDto })
  @ApiBadRequestResponse({
    description: "start_date must be <= end_date o finales fuera de rango",
  })
  @ApiNotFoundResponse({ description: "Exam table not found" })
  @Put("edit/:id")
  edit(@Param("id") id: string, @Body() dto: EditFinalExamTableDto) {
    return this.svc.edit(+id, dto);
  }

  @ApiOperation({ summary: "Eliminar mesa de examen" })
  @ApiParam({ name: "id", type: Number, required: true })
  @ApiOkResponse({ type: DeletedResponseDto })
  @ApiNotFoundResponse({ description: "Exam table not found" })
  @ApiForbiddenResponse({
    description: "Insufficient hierarchy to delete old exam tables",
  })
  @Delete("delete/:id")
  remove(@Param("id") id: string, @Req() req: any) {
    const role = req.user?.role ?? "PRECEPTOR";
    return this.svc.remove(+id, role);
  }

  @ApiOperation({ summary: "Listar todas las mesas de examen" })
  @ApiOkResponse({ type: ExamTableResponseDto, isArray: true })
  @Get("list")
  listAll() {
    return this.svc.list();
  }

  @ApiOperation({ summary: "Obtener una mesa de examen por ID" })
  @ApiParam({ name: "id", required: true, type: Number })
  @ApiOkResponse({ type: ExamTableResponseDto })
  @ApiNotFoundResponse({ description: "Exam table not found" })
  @Get("list/:id")
  listOne(@Param("id") id: string) {
    const n = Number(id);
    if (Number.isNaN(n)) throw new BadRequestException("id must be a number");
    return this.svc.list(n);
  }
}
