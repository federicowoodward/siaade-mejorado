import { Controller, Get, Param, UseGuards, Req, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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

  @Get("status/subjects")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("students.readSubjectsStatus")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
    ROLE.STUDENT,
  )
  @ApiOperation({
    summary: "Listado de status del alumno en todas las materias (con query param)",
  })
  @ApiQuery({ name: "studentId", type: String, required: false })
  @ApiOkResponse({ description: "Lista de materias con condición" })
  getSubjectsStatusByQuery(
    @Query("studentId") studentId: string,
    @Req() req: any,
  ) {
    // Si no se proporciona studentId, usar el ID del usuario autenticado
    const targetId = studentId || req.user.id;
    return this.service.getSubjectsStatusFlat(targetId);
  }

  @Get("status/action-context")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Action("students.readActionContext")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
    ROLE.STUDENT,
  )
  @ApiOperation({
    summary: "Contexto de acciones (ventanas, correlativas) para el alumno",
  })
  @ApiQuery({ name: "studentId", type: String, required: false })
  @ApiOkResponse({ description: "Contexto de acciones" })
  getActionContext(@Query("studentId") studentId: string, @Req() req: any) {
    const targetId = studentId || req.user.id;
    return this.service.getActionContext(targetId);
  }


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
  @ApiOperation({ summary: "Obtener resumen de MI data académica (usuario autenticado)" })
  @ApiOkResponse({ description: "Resumen del alumno (self)" })
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
  @ApiOperation({ summary: "Obtener resumen de data académica de un alumno" })
  @ApiParam({ name: "id", type: String })
  @ApiOkResponse({ description: "Resumen del alumno" })
  getSummary(@Param("id") id: string) {
    return this.service.getStudentSummary(id);
  }
}
