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
}
