import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
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
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { Action } from "@/shared/rbac/decorators/action.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";

import { SubjectsService } from "./subjects.service";
import { GradeRowDto } from "./dto/grade-row.dto";
import { PatchCellDto } from "./dto/patch-cell.dto";
import { UpsertGradeDto } from "./dto/upsert-grade.dto";
import { UpdateSubjectGradeDto } from "./dto/update-subject-grade.dto";
import { ParseObjectIdPipe } from "./pipes/parse-object-id.pipe";
import { MoveStudentCommissionDto } from "./dto/move-student-commission.dto";
import { UpdateSubjectCommissionTeacherDto } from "./dto/update-subject-commission-teacher.dto";
import {
  ToggleEnrollmentDto,
  ToggleEnrollmentResponseDto,
} from "@/modules/shared/dto/toggle-enrollment.dto";

type AuthenticatedUser = {
  id: string;
  role?: ROLE | null;
};

@ApiTags("subjects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AllowRoles(
  ROLE.EXECUTIVE_SECRETARY,
  ROLE.SECRETARY,
  ROLE.PRECEPTOR,
  ROLE.TEACHER,
)
@Controller("subject-commissions")
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Put(":subjectCommissionId/grades")
  @Action("subjects.bulkUpsertGrades")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({
    summary: "Actualizar notas y asistencia de multiples alumnos",
  })
  @ApiParam({ name: "subjectCommissionId", type: Number })
  @ApiBody({ type: UpsertGradeDto })
  async upsertGrades(
    @Param("subjectCommissionId", ParseIntPipe) subjectCommissionId: number,
    @Body() dto: UpsertGradeDto,
    @Req() req: Request,
  ): Promise<{ updated: number }> {
    if (!dto?.rows?.length) {
      throw new BadRequestException("rows payload is required");
    }

    return this.subjectsService.upsertGrades(
      subjectCommissionId,
      dto,
      req.user as AuthenticatedUser,
    );
  }

  @Patch(":subjectCommissionId/teacher")
  @Action("subjects.updateSubjectCommissionTeacher")
  @AllowRoles(ROLE.EXECUTIVE_SECRETARY, ROLE.SECRETARY, ROLE.PRECEPTOR)
  @ApiOperation({
    summary: "Cambiar el docente asignado a una subject_commission",
  })
  @ApiParam({ name: "subjectCommissionId", type: Number })
  @ApiBody({ type: UpdateSubjectCommissionTeacherDto })
  async updateTeacher(
    @Param("subjectCommissionId", ParseIntPipe) subjectCommissionId: number,
    @Body() dto: UpdateSubjectCommissionTeacherDto,
    @Req() req: Request,
  ) {
    return this.subjectsService.updateSubjectCommissionTeacher(
      subjectCommissionId,
      dto.teacherId,
      req.user as AuthenticatedUser,
    );
  }
}

@ApiTags("subjects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AllowRoles(
  ROLE.EXECUTIVE_SECRETARY,
  ROLE.SECRETARY,
  ROLE.PRECEPTOR,
  ROLE.TEACHER,
)
@Controller("subjects")
export class SubjectGradesController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get(":subjectId/academic-situation")
  @Action("subjects.getSubjectAcademicSituation")
  @ApiOperation({
    summary: "Obtener la situacion academica de una materia",
  })
  @ApiParam({ name: "subjectId" })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        subject: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" },
            partials: { type: "number", enum: [2, 4] },
          },
        },
        commissions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              letter: { type: "string", nullable: true },
              teacherWindow: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["open", "closed"] },
                  openedAt: { type: "string", nullable: true },
                  closesAt: { type: "string", nullable: true },
                  remainingDays: { type: "number", nullable: true },
                },
              },
            },
          },
        },
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              studentId: { type: "string" },
              fullName: { type: "string" },
              legajo: { type: "string" },
              dni: { type: "string" },
              commissionId: { type: "number" },
              commissionLetter: { type: "string", nullable: true },
              note1: { type: "number", nullable: true },
              note2: { type: "number", nullable: true },
              note3: { type: "number", nullable: true },
              note4: { type: "number", nullable: true },
              final: { type: "number", nullable: true },
              attendancePercentage: { type: "number" },
              condition: { type: "string", nullable: true },
              enrolled: { type: "boolean" },
            },
          },
        },
      },
    } as any,
  })
  async getSubjectAcademicSituation(
    @Param("subjectId", ParseIntPipe) subjectId: number,
    @Query("q") q?: string,
    @Query("commissionId", new ParseIntPipe({ optional: true }))
    commissionId?: number,
  ) {
    return this.subjectsService.getSubjectAcademicSituation(subjectId, {
      q: q?.trim() || undefined,
      commissionId: commissionId ?? undefined,
    });
  }

  @Patch(":subjectId/grades/:studentId")
  @Action("subjects.patchSubjectGrade")
  @ApiOperation({
    summary: "Actualizar una nota puntual de un alumno dentro de una materia",
  })
  @ApiParam({ name: "subjectId" })
  @ApiParam({ name: "studentId" })
  @ApiBody({ type: UpdateSubjectGradeDto })
  @ApiOkResponse({ type: GradeRowDto })
  async patchSubjectGrade(
    @Param("subjectId", ParseIntPipe) subjectId: number,
    @Param("studentId", ParseObjectIdPipe) studentId: string,
    @Body() dto: UpdateSubjectGradeDto,
    @Req() req: Request,
  ): Promise<GradeRowDto> {
    return this.subjectsService.patchSubjectGrade(
      subjectId,
      studentId,
      dto,
      req.user as AuthenticatedUser,
    );
  }

  @Patch(":subjectId/teacher")
  @Action("subjects.updateSubjectTeachers")
  @AllowRoles(ROLE.EXECUTIVE_SECRETARY, ROLE.SECRETARY, ROLE.PRECEPTOR)
  @ApiOperation({
    summary: "Asignar/cambiar docente para todas las comisiones de una materia",
  })
  @ApiParam({ name: "subjectId" })
  @ApiBody({ type: UpdateSubjectCommissionTeacherDto })
  async updateSubjectTeachers(
    @Param("subjectId", ParseIntPipe) subjectId: number,
    @Body() dto: UpdateSubjectCommissionTeacherDto,
    @Req() req: Request,
  ) {
    return this.subjectsService.updateAllSubjectCommissionsTeacher(
      subjectId,
      dto.teacherId,
      req.user as AuthenticatedUser,
    );
  }

  @Patch(":subjectId/students/:studentId/commission")
  @Action("subjects.moveStudentCommission")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({
    summary:
      "Mover alumno de comisión dentro de la misma materia transfiriendo notas y estado",
  })
  @ApiParam({ name: "subjectId" })
  @ApiParam({ name: "studentId" })
  @ApiBody({ type: MoveStudentCommissionDto })
  @ApiOkResponse({ type: GradeRowDto })
  async moveStudentCommission(
    @Param("subjectId", ParseIntPipe) subjectId: number,
    @Param("studentId", ParseObjectIdPipe) studentId: string,
    @Body() dto: MoveStudentCommissionDto,
    @Req() req: Request,
  ): Promise<GradeRowDto> {
    return this.subjectsService.moveStudentToCommission(
      subjectId,
      studentId,
      dto.toCommissionId,
      req.user as AuthenticatedUser,
    );
  }
}

@ApiTags("subjects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AllowRoles(
  ROLE.EXECUTIVE_SECRETARY,
  ROLE.SECRETARY,
  ROLE.PRECEPTOR,
  ROLE.TEACHER,
  ROLE.STUDENT,
)
@Controller("subject-status")
export class SubjectStatusController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Patch(":subjectCommissionId/grades/:studentId")
  @Action("subjects.patchCommissionCell")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({
    summary: "Actualizar una celda de notas y asistencia para un alumno",
  })
  @ApiParam({ name: "subjectCommissionId" })
  @ApiParam({ name: "studentId" })
  @ApiBody({ type: PatchCellDto })
  @ApiOkResponse({ type: GradeRowDto })
  async patchCell(
    @Param("subjectCommissionId", ParseIntPipe) subjectCommissionId: number,
    @Param("studentId", ParseObjectIdPipe) studentId: string,
    @Body() dto: PatchCellDto,
    @Req() req: Request,
  ): Promise<GradeRowDto> {
    return this.subjectsService.patchCell(
      subjectCommissionId,
      studentId,
      dto,
      req.user as AuthenticatedUser,
    );
  }

  @Get()
  @Action("subjects.listStatuses")
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
    } as any,
  })
  async listStatuses() {
    return this.subjectsService.getSubjectStatuses();
  }

  @Get(":subjectCommissionId/grades")
  @Action("subjects.listCommissionGrades")
  @ApiOperation({ summary: "Listar notas y asistencia de una comision" })
  @ApiParam({ name: "subjectCommissionId" })
  @ApiOkResponse({ type: GradeRowDto, isArray: true })
  async getGrades(
    @Param("subjectCommissionId", ParseIntPipe) subjectCommissionId: number,
  ): Promise<GradeRowDto[]> {
    return this.subjectsService.getGrades(subjectCommissionId);
  }

  @Get(":subjectId/grades")
  @Action("subjects.listSubjectGrades")
  @ApiOperation({
    summary:
      "Listar notas y asistencia agrupadas por comision para una materia",
  })
  @ApiParam({ name: "subjectId" })
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
    } as any,
  })
  async getSubjectGrades(
    @Param("subjectId", ParseIntPipe) subjectId: number,
  ): ReturnType<SubjectsService["getSubjectGradesBySubject"]> {
    return this.subjectsService.getSubjectGradesBySubject(subjectId);
  }
}

@ApiTags("subjects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AllowRoles(
  ROLE.EXECUTIVE_SECRETARY,
  ROLE.SECRETARY,
  ROLE.PRECEPTOR,
  ROLE.STUDENT,
)
@Controller("subjects/enrollments")
export class SubjectEnrollmentController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post("toggle")
  @ApiOperation({
    summary: "Inscribir/Desinscribir alumno en una comisión de materia",
  })
  @ApiBody({ type: ToggleEnrollmentDto })
  @ApiOkResponse({ type: ToggleEnrollmentResponseDto })
  async toggleSubjectEnrollment(
    @Body() dto: ToggleEnrollmentDto,
    @Req() req: Request,
  ): Promise<ToggleEnrollmentResponseDto> {
    const user = req.user as { role?: ROLE | null };
    const actor =
      user?.role === ROLE.PRECEPTOR
        ? "preceptor"
        : user?.role === ROLE.STUDENT
          ? "student"
          : "system";
    if (!dto.subjectCommissionId) {
      throw new BadRequestException("subjectCommissionId is required");
    }
    return this.subjectsService.toggleSubjectEnrollmentRich(
      dto.subjectCommissionId,
      dto.studentId,
      dto.action,
      actor,
    );
  }
}
