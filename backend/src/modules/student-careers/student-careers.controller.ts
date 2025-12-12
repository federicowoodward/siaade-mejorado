import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";
import { StudentCareersService } from "./student-careers.service";
import { AssignStudentCareerDto } from "./dto/assign-student-career.dto";
import { UpdateStudentCareerDto } from "./dto/update-student-career.dto";

@ApiTags("Student careers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AllowRoles(ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY)
@Controller("student-careers")
export class StudentCareersController {
  constructor(private readonly service: StudentCareersService) {}

  @Get()
  @ApiOperation({
    summary: "Listado de alumnos y su estado de inscripcion a carrera",
  })
  @ApiOkResponse({ description: "Estados de alumno-carrera" })
  async listStates() {
    const data = await this.service.findAllStates();
    return { data };
  }

  @Post("assign")
  @ApiOperation({
    summary: "Asigna un alumno existente a una carrera",
  })
  async assign(@Body() dto: AssignStudentCareerDto) {
    return this.service.assignStudentToCareer(dto.studentId, dto.careerId);
  }

  @Post("update")
  @ApiOperation({
    summary:
      "Actualiza la carrera de un alumno (null para desasignar sin tocar materias)",
  })
  async update(@Body() dto: UpdateStudentCareerDto) {
    return this.service.updateStudentCareer(dto.studentId, dto.careerId ?? null);
  }
}
