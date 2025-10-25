import { Controller, Get, Query, Param, ParseIntPipe } from "@nestjs/common";
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
}
