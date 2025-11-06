import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiOkResponse,
  ApiParam,
} from "@nestjs/swagger";
import { normalizePagination, buildPageMeta } from "@/shared/utils/pagination";
import { CatalogsService } from "./catalogs.service";

@ApiTags("Catalogs")
@ApiBearerAuth()
@Controller("catalogs")
export class CatalogsController {
  constructor(private readonly service: CatalogsService) {}

  @Get("careers")
  @ApiOperation({ summary: "Listar carreras" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiOkResponse({
    description: "Lista paginada de carreras",
    schema: {
      type: "object",
      properties: {
        data: { type: "array", items: { type: "object" } },
        meta: { type: "object" },
      },
    },
  })
  async findCareers(
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.service.findCareers({
      skip: offset,
      take: l,
    });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }

  @Get("career-full-data/:careerId")
  @ApiOperation({ summary: "Obtener datos completos de una carrera" })
  @ApiParam({ name: "careerId", type: Number, required: true })
  @ApiOkResponse({
    description: "Datos completos de la carrera",
    schema: {
      type: "object",
      properties: {
        career: { type: "object" },
        preceptor: { type: "object" },
        academicPeriods: { type: "array", items: { type: "object" } },
      },
    },
  })
  async findCareerFullData(@Param("careerId", ParseIntPipe) careerId: number) {
    return this.service.findCareerFullData(careerId);
  }

  @Get("career-students-by-commission/:careerId")
  @ApiOperation({
    summary: "Listar alumnos de una carrera agrupados por comisión",
  })
  @ApiParam({ name: "careerId", type: Number, required: true })
  @ApiQuery({ name: "studentStartYear", required: false, type: Number })
  @ApiOkResponse({
    description: "Detalle de alumnos agrupados por comisión",
    schema: {
      type: "object",
      properties: {
        career: { type: "object" },
        filters: { type: "object" },
        commissions: { type: "array", items: { type: "object" } },
      },
    },
  })
  async findCareerStudentsByCommission(
    @Param("careerId", ParseIntPipe) careerId: number,
    @Query("studentStartYear") studentStartYear?: number
  ) {
    const parsedStartYear =
      studentStartYear !== undefined && studentStartYear !== null
        ? Number(studentStartYear)
        : undefined;

    if (
      parsedStartYear !== undefined &&
      (Number.isNaN(parsedStartYear) || !Number.isInteger(parsedStartYear))
    ) {
      throw new BadRequestException("studentStartYear must be an integer year");
    }

    return this.service.findCareerStudentsByCommission(careerId, {
      studentStartYear: parsedStartYear,
    });
  }

  @Get("academic-periods")
  @ApiOperation({ summary: "Listar períodos académicos" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiOkResponse({
    description: "Lista paginada de períodos académicos",
    schema: {
      type: "object",
      properties: {
        data: { type: "array", items: { type: "object" } },
        meta: { type: "object" },
      },
    },
  })
  async findAcademicPeriods(
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.service.findAcademicPeriods({
      skip: offset,
      take: l,
    });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }

  @Get("commissions")
  @ApiOperation({ summary: "Listar comisiones" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiOkResponse({
    description: "Lista paginada de comisiones",
    schema: {
      type: "object",
      properties: {
        data: { type: "array", items: { type: "object" } },
        meta: { type: "object" },
      },
    },
  })
  async findCommissions(
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.service.findCommissions({
      skip: offset,
      take: l,
    });
    return { data: rows, meta: buildPageMeta(total, p, l) };
  }

  @Get("subject-commissions/:commissionId")
  @ApiOperation({ summary: "Detalle de materias y docentes de una comision" })
  @ApiParam({ name: "commissionId", type: Number, required: true })
  @ApiOkResponse({
    description: "Detalle de la comision con sus materias y docentes",
    schema: {
      type: "object",
      properties: {
        commission: { type: "object" },
        subjects: { type: "array", items: { type: "object" } },
      },
    },
  })
  async findCommissionSubjects(
    @Param("commissionId", ParseIntPipe) commissionId: number
  ) {
    return this.service.findCommissionSubjects(commissionId);
  }

  @Get("subject/:subjectId/commission-teachers")
  @ApiOperation({
    summary: "Listar comisiones de una materia junto a los docentes asignados",
  })
  @ApiParam({ name: "subjectId", type: Number, required: true })
  @ApiOkResponse({
    description: "Comisiones y docentes asignados para la materia requerida",
  })
  getSubjectCommissionTeachers(
    @Param("subjectId", ParseIntPipe) subjectId: number
  ) {
    return this.service.getSubjectCommissionTeachers(subjectId);
  }

  @Get("teachers")
  @ApiOperation({ summary: "Listar todos los docentes" })
  @ApiOkResponse({ description: "Listado completo de docentes" })
  getAllTeachers() {
    return this.service.getAllTeachers();
  }

  @Get("teacher/:teacherId/subject-commissions")
  @ApiOperation({
    summary: "Listar materias y comisiones a cargo de un docente",
  })
  @ApiParam({ name: "teacherId", type: String, required: true })
  @ApiOkResponse({
    description: "Materias y comisiones en las que el docente está asignado",
    schema: {
      type: 'object',
      properties: {
        teacher: { type: 'object', nullable: true },
        subjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subject: {
                type: 'object',
                properties: { id: { type: 'number' }, name: { type: 'string' } },
              },
              commissions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    letter: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  getTeacherSubjectAssignments(@Param('teacherId') teacherId: string) {
    return this.service.getTeacherSubjectAssignments(teacherId);
  }

  @Get('student/:studentId/academic-subjects-minimal')
  @ApiOperation({ summary: 'Materias por año para un estudiante (mínimo)' })
  @ApiParam({ name: 'studentId', type: String, required: true })
  @ApiOkResponse({
    description: 'Mapa de materias agrupadas por año',
    schema: {
      type: 'object',
      properties: {
        byYear: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                subjectName: { type: 'string' },
                year: { type: 'number', nullable: true },
                division: { type: 'string', nullable: true },
                condition: { type: 'string' },
                examInfo: { type: 'string' },
              },
            },
          },
        },
      },
    },
  })
  getStudentAcademicSubjectsMinimal(@Param('studentId') studentId: string) {
    return this.service.getStudentAcademicSubjectsMinimal(studentId);
  }

  @Get('student/:studentId/academic-status')
  @ApiOperation({ summary: 'Situación académica real por estudiante' })
  @ApiParam({ name: 'studentId', type: String, required: true })
  @ApiOkResponse({
    description: 'Materias del estudiante agrupadas por año con notas, final y asistencia',
  })
  getStudentAcademicStatus(@Param('studentId') studentId: string) {
    return this.service.getStudentAcademicStatus(studentId);
  }
}
