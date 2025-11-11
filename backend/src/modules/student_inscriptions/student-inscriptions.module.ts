import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StudentInscriptionsController } from "./student-inscriptions.controller";
import { FinalExam } from "@/entities/finals/final-exam.entity";
import { ExamTable } from "@/entities/finals/exam-table.entity";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";
import { Subject } from "@/entities/subjects/subject.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { PrerequisitesModule } from "@/modules/prerequisites/prerequisites.module";
import { StudentInscriptionAudit } from "@/entities/inscriptions/student-inscription-audit.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinalExam,
      ExamTable,
      FinalExamsStudent,
      Subject,
      CareerStudent,
      CareerSubject,
      StudentInscriptionAudit,
    ]),
    PrerequisitesModule,
  ],
  controllers: [StudentInscriptionsController],
})
export class StudentInscriptionsModule {}
