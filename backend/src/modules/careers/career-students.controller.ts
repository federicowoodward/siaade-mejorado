import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";
import { CareerStudentsService } from "./career-students.service";

@ApiTags("careers/students")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AllowRoles(ROLE.EXECUTIVE_SECRETARY, ROLE.SECRETARY)
@Controller("careers")
export class CareerStudentsController {
  constructor(private readonly service: CareerStudentsService) {}

  @Get(":careerId/students")
  @ApiOperation({ summary: "Listar alumnos de una carrera con su comision asignada" })
  @ApiParam({ name: "careerId", type: Number })
  @ApiQuery({ name: "q", required: false, description: "Filtro por nombre, apellido, email o legajo" })
  @ApiQuery({ name: "page", required: false, description: "Numero de pagina (desde 1)" })
  @ApiQuery({ name: "pageSize", required: false, description: "Cantidad de resultados por pagina" })
  @ApiQuery({ name: "sort", required: false, description: "Campo y direccion. Ej: last_name:asc" })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            properties: {
              studentId: { type: "string" },
              fullName: { type: "string" },
              legajo: { type: "string" },
              email: { type: "string" },
              commission: {
                type: "object",
                properties: {
                  id: { type: "number", nullable: true },
                  letter: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        meta: {
          type: "object",
          properties: {
            page: { type: "number" },
            pageSize: { type: "number" },
            total: { type: "number" },
          },
        },
      },
    },
  })
  async listCareerStudents(
    @Param("careerId", ParseIntPipe) careerId: number,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("sort") sort?: string
  ) {
    const pageNumber = this.parseNumeric(page);
    const pageSizeNumber = this.parseNumeric(pageSize);

    return this.service.listCareerStudents(careerId, {
      q: q?.trim() || undefined,
      page: pageNumber ?? 1,
      pageSize: pageSizeNumber ?? 20,
      sort: sort?.trim() || undefined,
    });
  }

  private parseNumeric(value?: string): number | undefined {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
