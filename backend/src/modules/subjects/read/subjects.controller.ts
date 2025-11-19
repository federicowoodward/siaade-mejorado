import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { Action } from "@/shared/rbac/decorators/action.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";
import { SubjectsReadService } from "./subjects.service";

@ApiTags("subjects")
@ApiBearerAuth()
@Controller("subjects/read")
export class SubjectsReadController {
  constructor(private readonly service: SubjectsReadService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("subjects.readAll")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({ summary: "Listar materias (mínimo)" })
  @ApiOkResponse({
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          subjectName: { type: "string" },
        },
      },
    },
  })
  getAll() {
    return this.service.getAll();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("subjects.readOne")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({ summary: "Obtener una materia por id (mínimo)" })
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({
    schema: {
      type: "object",
      nullable: true,
      properties: {
        id: { type: "number" },
        subjectName: { type: "string" },
      },
    },
  })
  getOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.getOne(id);
  }
}
