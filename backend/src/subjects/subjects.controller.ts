import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Req,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";

import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/guards/roles.guard";
import { Roles } from "@/modules/users/auth/roles.decorator";
import { ROLE_NAMES } from "@/shared/constants/roles";

import { SubjectsService } from "./subjects.service";
import { GradeRowDto } from "./dto/grade-row.dto";
import { PatchCellDto } from "./dto/patch-cell.dto";
import { UpsertGradeDto } from "./dto/upsert-grade.dto";
import { ParseObjectIdPipe } from "./pipes/parse-object-id.pipe";

type AuthenticatedUser = {
  id: string;
  role?: { name?: string };
  isDirective?: boolean;
};

@ApiTags("subjects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  ROLE_NAMES.SECRETARIO_DIRECTIVO,
  ROLE_NAMES.SECRETARIO,
  ROLE_NAMES.PRECEPTOR,
  ROLE_NAMES.PROFESOR
)
@Controller("subject-commissions")
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get(":subjectCommissionId/grades")
  @ApiOperation({ summary: "Listar notas y asistencia de una comisión" })
  @ApiParam({ name: "subjectCommissionId", type: Number })
  @ApiOkResponse({ type: GradeRowDto, isArray: true })
  async getGrades(
    @Param("subjectCommissionId", ParseIntPipe) subjectCommissionId: number
  ): Promise<GradeRowDto[]> {
    return this.subjectsService.getGrades(subjectCommissionId);
  }

  @Patch(":subjectCommissionId/grades/:studentId")
  @Roles(
    ROLE_NAMES.SECRETARIO_DIRECTIVO,
    ROLE_NAMES.SECRETARIO,
    ROLE_NAMES.PRECEPTOR,
    ROLE_NAMES.PROFESOR
  )
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
  @Roles(
    ROLE_NAMES.SECRETARIO_DIRECTIVO,
    ROLE_NAMES.SECRETARIO,
    ROLE_NAMES.PRECEPTOR,
    ROLE_NAMES.PROFESOR
  )
  @ApiOperation({ summary: "Actualizar notas/asistencia de múltiples alumnos" })
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
@Roles(
  ROLE_NAMES.SECRETARIO_DIRECTIVO,
  ROLE_NAMES.SECRETARIO,
  ROLE_NAMES.PRECEPTOR,
  ROLE_NAMES.PROFESOR
)
@Controller("subjects")
export class SubjectGradesController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get(":subjectId/grades")
  @ApiOperation({
    summary:
      "Listar notas y asistencia agrupadas por comisión para una materia",
  })
  @ApiParam({ name: "subjectId", type: Number })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        subject: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
          },
        },
        commissions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              commission: {
                type: "object",
                properties: {
                  id: { type: "number" },
                  letter: { type: "string", nullable: true },
                },
              },
              partials: {
                type: "number",
                enum: [2, 4],
              },
              rows: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    studentId: { type: "string" },
                    fullName: { type: "string" },
                    legajo: { type: "string" },
                    note1: { type: "number", nullable: true },
                    note2: { type: "number", nullable: true },
                    note3: { type: "number", nullable: true },
                    note4: { type: "number", nullable: true },
                    final: { type: "number", nullable: true },
                    attendancePercentage: { type: "number" },
                    condition: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async getSubjectGrades(
    @Param("subjectId", ParseIntPipe) subjectId: number
  ): ReturnType<SubjectsService["getSubjectGradesBySubject"]> {
    return this.subjectsService.getSubjectGradesBySubject(subjectId);
  }
}

@ApiTags("subjects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  ROLE_NAMES.SECRETARIO_DIRECTIVO,
  ROLE_NAMES.SECRETARIO,
  ROLE_NAMES.PRECEPTOR,
  ROLE_NAMES.PROFESOR,
  ROLE_NAMES.ALUMNO
)
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
