import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiOkResponse,
} from "@nestjs/swagger";
import { Request } from "express";
import { normalizePagination, buildPageMeta } from "@/shared/utils/pagination";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { NoticesService, AuthenticatedUser } from "./notices.service";
import { CreateNoticeDto } from "./dto/create-notice.dto";
import { UpdateNoticeDto } from "./dto/update-notice.dto";
import { ROLE } from "@/shared/rbac/roles.constants";

@ApiTags("Notices")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@AllowRoles(
  ROLE.EXECUTIVE_SECRETARY,
  ROLE.SECRETARY,
  ROLE.PRECEPTOR,
  ROLE.TEACHER,
  ROLE.STUDENT,
)
@Controller("notices")
export class NoticesController {
  constructor(private readonly service: NoticesService) {}

  @Post()
  @AllowRoles(ROLE.PRECEPTOR, ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY)
  @ApiOperation({ summary: "Crear aviso/post" })
  create(@Body() dto: CreateNoticeDto, @Req() req: Request) {
    const userId = (req.user as AuthenticatedUser | undefined)?.id;
    return this.service.create(dto, userId);
  }

  @Patch(":id")
  @AllowRoles(ROLE.PRECEPTOR, ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY)
  @ApiOperation({ summary: "Editar aviso/post" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateNoticeDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @AllowRoles(ROLE.PRECEPTOR, ROLE.SECRETARY, ROLE.EXECUTIVE_SECRETARY)
  @ApiOperation({ summary: "Eliminar aviso/post" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Get()
  @ApiQuery({
    name: "audience",
    required: false,
    enum: ["student", "teacher", "all"],
  })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiOperation({
    summary: "Listar avisos por audiencia (student/teacher/all)",
  })
  @ApiOkResponse({
    description: "Lista paginada de avisos",
    schema: {
      type: "object",
      properties: {
        data: { type: "array", items: { type: "object" } },
        meta: { type: "object" },
      },
    } as any,
  })
  async findAll(
    @Query("audience") audience?: "student" | "teacher" | "all",
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Req() req?: Request,
  ) {
    const { page: p, limit: l, offset } = normalizePagination({ page, limit });
    const [rows, total] = await this.service.findAllByAudience(
      audience,
      {
        skip: offset,
        take: l,
      },
      req?.user as AuthenticatedUser | undefined,
    );
    const meta = buildPageMeta(total, p, l) as Record<string, any>;
    meta.segment_by_commission = this.service.segmentingByCommission;
    return { data: rows, meta };
  }
}
