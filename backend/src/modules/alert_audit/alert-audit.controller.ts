import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { RolesGuard } from "@/shared/rbac/guards/roles.guard";
import { AllowRoles } from "@/shared/rbac/decorators/allow-roles.decorator";
import { ROLE } from "@/shared/rbac/roles.constants";
import { buildPageMeta } from "@/shared/utils/pagination";
import { AlertAuditService } from "./alert-audit.service";
import { CreateAlertAuditDto } from "./dto/create-alert-audit.dto";

type RequestUser = { id?: string | null };

@ApiTags("AlertAudit")
@Controller("audit/alerts")
export class AlertAuditController {
  constructor(private readonly service: AlertAuditService) {}

  @Post()
  @ApiOperation({
    summary: "Registrar una alerta de UI (toast) desde el frontend",
  })
  async create(@Body() dto: CreateAlertAuditDto, @Req() req: Request) {
    const userId = (req.user as RequestUser | undefined)?.id ?? undefined;
    await this.service.recordAlert(dto, userId);
    return { status: "queued" };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @AllowRoles(ROLE.SECRETARY)
  @ApiOperation({
    summary: "Listar alertas de UI auditadas (solo secretaria)",
  })
  async findAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    const {
      data,
      total,
      page: p,
      limit: l,
    } = await this.service.findAll(page, limit);
    const meta = buildPageMeta(total, p, l);
    return { data, meta };
  }
}
