import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger";
import { Request } from "express";
import { StudentInscriptionsService } from "./student-inscriptions.service";
import { ExamTableFiltersDto } from "./dto/exam-table-filters.dto";
import { EnrollFinalDto } from "./dto/enroll-final.dto";
import { AuditEventDto } from "./dto/audit-event.dto";
import {
  StudentEnrollmentResponseDto,
  StudentExamTableDto,
} from "./dto/student-exam.dto";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";

@ApiTags("Student Inscriptions")
@ApiBearerAuth()
@ApiExtraModels(StudentExamTableDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@AllowRoles(ROLE.STUDENT)
@Controller("students/inscriptions")
export class StudentInscriptionsController {
  constructor(private readonly service: StudentInscriptionsService) {}

  private extractUserId(req: Request): string | null {
    const user = req.user as { id?: string; sub?: string } | undefined;
    return user?.id ?? user?.sub ?? null;
  }

  @Get("exam-tables")
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: { $ref: getSchemaPath(StudentExamTableDto) },
        },
      },
    },
  })
  async listExamTables(
    @Req() req: Request,
    @Query() query: ExamTableFiltersDto
  ) {
    const studentId = this.extractUserId(req);
    if (!studentId) {
      throw new UnauthorizedException("Missing authenticated user");
    }
    const data = await this.service.listExamTables(studentId, query);
    return { data };
  }

  @Post("exam-tables/:mesaId/enroll")
  async enroll(
    @Req() req: Request,
    @Param("mesaId", ParseIntPipe) mesaId: number,
    @Body() dto: EnrollFinalDto
  ): Promise<StudentEnrollmentResponseDto> {
    const studentId = dto.studentId ?? this.extractUserId(req);
    if (!studentId) {
      throw new UnauthorizedException("Missing authenticated user");
    }
    return this.service.enroll(studentId, mesaId, dto.callId);
  }

  @Post("audit-events")
  async audit(@Req() req: Request, @Body() dto: AuditEventDto) {
    const studentId = this.extractUserId(req);
    this.service.audit(dto, studentId);
    return { ok: true };
  }
}
