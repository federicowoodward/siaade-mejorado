import { Controller, Get, Param, UseGuards, Req, Query } from "@nestjs/common";
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

  @Get("me/summary")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("students.readMySummary")
  @AllowRoles(
    ROLE.STUDENT,
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({ summary: "Obtener mi resumen acad��mico" })
  @ApiOkResponse({ description: "Resumen acad��mico del alumno (self)" })
  getMySummary(@Req() req: any) {
    return this.service.getStudentSummary(req.user.id);
  }

  @Get(":id/summary")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("students.readSummary")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({ summary: "Obtener resumen acad��mico de un alumno" })
  @ApiParam({ name: "id", type: String })
  @ApiOkResponse({ description: "Resumen acad��mico del alumno" })
  getSummary(@Param("id") id: string) {
    return this.service.getStudentSummary(id);
  }

  @Get(":id/full")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("students.readFull")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
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

  // Compat: endpoint con query param studentId (o self si falta)
  @Get("status/subjects")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("students.readSubjectsStatus")
  @AllowRoles(
    ROLE.STUDENT,
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({
    summary:
      "Listado de status del alumno (permite studentId como query; si falta usa el autenticado)",
  })
  getSubjectsStatusCompat(
    @Req() req: any,
    @Query("studentId") studentId?: string,
  ) {
    const targetId = studentId || req.user.id;
    return this.service.getSubjectsStatusFlat(targetId);
  }

  // Compat: contexto de acciones (ventanas/correlativas); por ahora payload estandar vacío
  @Get("status/action-context")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("students.readSubjectsStatus")
  @AllowRoles(
    ROLE.STUDENT,
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({
    summary:
      "Contexto de acciones para materias (windows/correlativas); devuelve estructura vacía",
  })
  getActionContextCompat(
    @Req() req: any,
    @Query("studentId") studentId?: string,
  ) {
    const targetId = studentId || req.user.id;
    return this.service.getActionContext(targetId);
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
