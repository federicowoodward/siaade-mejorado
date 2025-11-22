import { Controller, Get, Param, UseGuards, Req } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { StudentsReadService } from "./students.service";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { Action } from "@/shared/rbac/decorators/action.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";

@ApiTags("students")
@ApiBearerAuth()
@Controller("students/read")
export class StudentsReadController {
  constructor(private readonly service: StudentsReadService) {}

  @Get(":id/full")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("students.readFull")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
    ROLE.STUDENT,
  )
  @ApiOperation({ summary: "Obtener toda la data de un alumno" })
  @ApiParam({ name: "id", type: String })
  @ApiOkResponse({ description: "Datos completos del alumno" })
  getFull(@Param("id") id: string) {
    return this.service.getStudentFullData(id);
  }

  @Get(":id/subjects/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("students.readSubjectsStatus")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({
    summary: "Listado de status del alumno en todas las materias (plano)",
  })
  @ApiParam({ name: "id", type: String })
  @ApiOkResponse({ description: "Lista de materias con condición" })
  getSubjectsStatus(@Param("id") id: string) {
    return this.service.getSubjectsStatusFlat(id);
  }

  @Get("me/subjects/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("students.readMySubjectsStatus")
  @AllowRoles(
    ROLE.STUDENT,
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({
    summary: "Listado de status de MIS materias (usuario autenticado)",
  })
  @ApiOkResponse({ description: "Lista de materias con condición (self)" })
  getMySubjectsStatus(@Req() req: any) {
    return this.service.getSubjectsStatusFlat(req.user.id);
  }

  @Get("me/full")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("students.readMyFull")
  @AllowRoles(
    ROLE.STUDENT,
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({ summary: "Obtener toda MI data (usuario autenticado)" })
  @ApiOkResponse({ description: "Datos completos del alumno (self)" })
  getMyFull(@Req() req: any) {
    return this.service.getStudentFullData(req.user.id);
  }
}
