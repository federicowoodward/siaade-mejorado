import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubjectPrerequisiteByOrder } from "@/entities/subjects/subject-prerequisite-by-order.entity";
import { Career } from "@/entities/registration/career.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { StudentSubjectProgress } from "@/entities/subjects/student-subject-progress.entity";
import { PrerequisitesService } from "./prerequisites.service";
import { PrerequisitesController } from "./prerequisites.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubjectPrerequisiteByOrder,
      Career,
      CareerSubject,
      CareerStudent,
      StudentSubjectProgress,
    ]),
  ],
  controllers: [PrerequisitesController],
  providers: [PrerequisitesService],
})
export class PrerequisitesModule {}
