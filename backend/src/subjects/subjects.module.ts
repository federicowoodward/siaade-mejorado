import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StudentSubjectProgress } from "@/entities/subjects/student-subject-progress.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { Student } from "@/entities/users/student.entity";
import { SubjectStatusType } from "@/entities/catalogs/subject-status-type.entity";
import { SubjectAbsence } from "@/entities/subjects/subject-absence.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";
import { SubjectsService } from "./subjects.service";
import {
  SubjectStatusController,
  SubjectsController,
} from "./subjects.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentSubjectProgress,
      SubjectCommission,
      Student,
      SubjectStatusType,
      SubjectAbsence,
      SubjectStudent,
    ]),
  ],
  controllers: [SubjectsController, SubjectStatusController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}

