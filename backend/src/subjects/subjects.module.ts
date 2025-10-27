import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StudentSubjectProgress } from "@/entities/subjects/student-subject-progress.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { Student } from "@/entities/users/student.entity";
import { SubjectStatusType } from "@/entities/catalogs/subject-status-type.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";
import { Subject } from "@/entities/subjects/subject.entity";
import { SubjectsService } from "./subjects.service";
import {
  SubjectStatusController,
  SubjectsController,
  SubjectGradesController,
} from "./subjects.controller";
import { ParseObjectIdPipe } from "./pipes/parse-object-id.pipe";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentSubjectProgress,
      SubjectCommission,
      Student,
      SubjectStatusType,
      SubjectStudent,
      Subject,
    ]),
  ],
  controllers: [SubjectsController, SubjectGradesController, SubjectStatusController],
  providers: [SubjectsService, ParseObjectIdPipe],
  exports: [SubjectsService],
})
export class SubjectsModule {}
