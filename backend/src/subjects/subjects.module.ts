import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StudentSubjectProgress } from "@/entities/subjects/student-subject-progress.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { Student } from "@/entities/users/student.entity";
import { SubjectStatusType } from "@/entities/catalogs/subject-status-type.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";
import { Subject } from "@/entities/subjects/subject.entity";
import { Exam } from "@/entities/subjects/exam.entity";
import { ExamResult } from "@/entities/subjects/exam-result.entity";
import { SubjectGradesView } from "@/subjects/views/subject-grades.view";
import { SubjectGradeAudit } from "@/entities/subjects/subject-grade-audit.entity";
import { SubjectsService } from "./subjects.service";
import { Teacher } from "@/entities/users/teacher.entity";
import { User } from "@/entities/users/user.entity";
import {
  SubjectStatusController,
  SubjectsController,
  SubjectGradesController,
  SubjectEnrollmentController,
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
      Exam,
      ExamResult,
      SubjectGradesView,
      SubjectGradeAudit,
      Teacher,
      User,
    ]),
  ],
  controllers: [
    SubjectsController,
    SubjectGradesController,
    SubjectStatusController,
    SubjectEnrollmentController,
  ],
  providers: [SubjectsService, ParseObjectIdPipe],
  exports: [SubjectsService],
})
export class SubjectsModule {}
