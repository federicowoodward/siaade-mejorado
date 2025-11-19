import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notice } from "@/entities/notices/notice.entity";
import { NoticeCommission } from "@/entities/notices/notice-commission.entity";
import { Role } from "@/entities/roles/role.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";
import { NoticesService } from "./notices.service";
import { NoticesController } from "./notices.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Notice, NoticeCommission, Role, SubjectStudent])],
  controllers: [NoticesController],
  providers: [NoticesService],
  exports: [NoticesService],
})
export class NoticesModule {}
