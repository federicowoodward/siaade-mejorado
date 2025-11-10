import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";
import { FinalExam } from "@/entities/finals/final-exam.entity";
import { ExamTable } from "@/entities/finals/exam-table.entity";
import { Subject } from "@/entities/subjects/subject.entity";
import { StudentInscriptionsController } from "./student-inscriptions.controller";
import { StudentInscriptionsService } from "./student-inscriptions.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([FinalExamsStudent, FinalExam, ExamTable, Subject]),
  ],
  controllers: [StudentInscriptionsController],
  providers: [StudentInscriptionsService],
  exports: [StudentInscriptionsService],
})
export class StudentInscriptionsModule {}
