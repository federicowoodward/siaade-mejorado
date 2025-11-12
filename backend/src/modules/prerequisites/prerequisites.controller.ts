import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";
import { OwnerGuard } from "@/guards/owner.guard";
import {
  PrerequisitesService,
  StudentPrereqOverviewEntry,
  SubjectPrereqList,
  ValidateEnrollmentResult,
} from "./prerequisites.service";
import { GetSubjectPrereqsParamsDto } from "./dto/get-subject-prereqs.dto";
import {
  ValidateEnrollmentParamsDto,
  ValidateEnrollmentQueryDto,
} from "./dto/validate-enrollment.dto";

@Controller("prerequisites")
@ApiTags("prerequisites")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrerequisitesController {
  constructor(private readonly prerequisitesService: PrerequisitesService) {}

  @Get("careers/:careerId/subjects/:orderNo")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
  )
  @ApiOperation({ summary: "Lista correlativas por número de orden" })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        careerId: { type: "number" },
        subjectOrderNo: { type: "number" },
        prereqs: {
          type: "array",
          items: { type: "number" },
        },
      },
    },
  })
  getSubjectPrereqs(
    @Param() params: GetSubjectPrereqsParamsDto,
  ): Promise<SubjectPrereqList> {
    return this.prerequisitesService.listPrereqsByOrder(
      params.careerId,
      params.orderNo,
    );
  }

  @Get("careers/:careerId/students/:studentId/validate")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
    ROLE.STUDENT,
  )
  @UseGuards(OwnerGuard)
  @ApiOperation({ summary: "Valida si el estudiante puede inscribirse" })
  @ApiQuery({
    name: "targetOrderNo",
    type: Number,
    required: true,
    description: "Número de orden de la materia objetivo dentro de la carrera",
  })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        careerId: { type: "number" },
        studentId: { type: "string", format: "uuid" },
        targetOrderNo: { type: "number" },
        canEnroll: { type: "boolean" },
        met: { type: "array", items: { type: "number" } },
        unmet: { type: "array", items: { type: "number" } },
      },
    },
  })
  validateEnrollment(
    @Param() params: ValidateEnrollmentParamsDto,
    @Query() query: ValidateEnrollmentQueryDto,
  ): Promise<ValidateEnrollmentResult> {
    return this.prerequisitesService.validateEnrollment(
      params.careerId,
      params.studentId,
      query.targetOrderNo,
    );
  }

  @Get("careers/:careerId/students/:studentId/overview")
  @AllowRoles(
    ROLE.EXECUTIVE_SECRETARY,
    ROLE.SECRETARY,
    ROLE.PRECEPTOR,
    ROLE.TEACHER,
    ROLE.STUDENT,
  )
  @UseGuards(OwnerGuard)
  @ApiOperation({
    summary:
      "Devuelve la vista completa de correlatividades para el estudiante",
  })
  @ApiOkResponse({
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          orderNo: { type: "number" },
          canEnrollNow: { type: "boolean" },
          unmet: { type: "array", items: { type: "number" } },
        },
      },
    },
  })
  getStudentOverview(
    @Param() params: ValidateEnrollmentParamsDto,
  ): Promise<StudentPrereqOverviewEntry[]> {
    return this.prerequisitesService.getStudentOverview(
      params.careerId,
      params.studentId,
    );
  }
}
