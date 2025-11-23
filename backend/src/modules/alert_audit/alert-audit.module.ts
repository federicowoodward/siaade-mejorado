import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UiAlertAudit } from "@/entities/audit/ui-alert-audit.entity";
import { AlertAuditController } from "./alert-audit.controller";
import { AlertAuditService } from "./alert-audit.service";
import { AlertAuditBufferService } from "./alert-audit-buffer.service";

@Module({
  imports: [TypeOrmModule.forFeature([UiAlertAudit])],
  controllers: [AlertAuditController],
  providers: [AlertAuditService, AlertAuditBufferService],
})
export class AlertAuditModule {}

