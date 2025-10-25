import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBody,
} from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/guards/roles.guard";
import { SubjectsService } from "./subjects.service";
import { GradeRowDto } from "./dto/grade-row.dto";
import { PatchCellDto } from "./dto/patch-cell.dto";
import { UpsertGradeDto } from "./dto/upsert-grade.dto";
import { Roles } from "@/modules/users/auth/roles.decorator";
import { ParseObjectIdPipe } from "./pipes/parse-object-id.pipe";

type AuthenticatedUser = {
  id: string;
  role?: { name?: string };
  isDirective?: boolean;
};

@ApiTags("subjects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SECRETARIO_DIRECTIVO", "SECRETARIO", "PRECEPTOR", "DOCENTE", "ALUMNO")
@Controller("subject-commissions")
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get(":subjectCommissionId/grades")
  @ApiOperation({
    summary: "Listar notas y asistencia de una comisión",
  })
  @ApiParam({
    name: "subjectCommissionId",
    type: Number,
  })
  @ApiOkResponse({ type: GradeRowDto, isArray: true })
  async getGrades(
    @Param("subjectCommissionId", ParseIntPipe) subjectCommissionId: number,
    @Req() req: Request
  ): Promise<GradeRowDto[]> {
    return this.subjectsService.getGrades(
      subjectCommissionId,
      req.user as AuthenticatedUser
    );
  }

  @Patch(":subjectCommissionId/grades/:studentId")
  @Roles("SECRETARIO_DIRECTIVO", "SECRETARIO", "PRECEPTOR", "DOCENTE")
  @ApiOperation({
    summary: "Actualizar una celda de notas/asistencia para un alumno",
  })
  @ApiParam({ name: "subjectCommissionId", type: Number })
  @ApiParam({ name: "studentId", type: String })
  @ApiBody({ type: PatchCellDto })
  @ApiOkResponse({ type: GradeRowDto })
  async patchCell(
    @Param("subjectCommissionId", ParseIntPipe) subjectCommissionId: number,
    @Param("studentId", ParseObjectIdPipe) studentId: string,
    @Body() dto: PatchCellDto,
    @Req() req: Request
  ): Promise<GradeRowDto> {
    return this.subjectsService.patchCell(
      subjectCommissionId,
      studentId,
      dto,
      req.user as AuthenticatedUser
    );
  }

  @Put(":subjectCommissionId/grades")
  @Roles("SECRETARIO_DIRECTIVO", "SECRETARIO", "PRECEPTOR", "DOCENTE")
  @ApiOperation({
    summary: "Actualizar notas/asistencia de múltiples alumnos",
  })
  @ApiParam({ name: "subjectCommissionId", type: Number })
  @ApiBody({ type: UpsertGradeDto })
  async upsertGrades(
    @Param("subjectCommissionId", ParseIntPipe) subjectCommissionId: number,
    @Body() dto: UpsertGradeDto,
    @Req() req: Request
  ): Promise<{ updated: number }> {
    if (!dto?.rows?.length) {
      throw new BadRequestException("rows payload is required");
    }
    return this.subjectsService.upsertGrades(
      subjectCommissionId,
      dto,
      req.user as AuthenticatedUser
    );
  }
}

@ApiTags("subjects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SECRETARIO_DIRECTIVO", "SECRETARIO", "PRECEPTOR", "DOCENTE", "ALUMNO")
@Controller("subject-status")
export class SubjectStatusController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: "Listar estados de materia" })
  @ApiOkResponse({
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          statusName: { type: "string" },
        },
      },
    },
  })
  async listStatuses() {
    return this.subjectsService.getSubjectStatuses();
  }
}

