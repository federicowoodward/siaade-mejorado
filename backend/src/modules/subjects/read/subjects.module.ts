import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Subject } from "@/entities/subjects/subject.entity";
import { SubjectsReadService } from "./subjects.service";
import { SubjectsReadController } from "./subjects.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Subject])],
  controllers: [SubjectsReadController],
  providers: [SubjectsReadService],
  exports: [SubjectsReadService],
})
export class SubjectsReadModule {}
