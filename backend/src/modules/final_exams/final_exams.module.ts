// src/modules/final_exams/final_exams.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FinalExam } from "@/entities/finals/final-exam.entity";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";
import { ExamTable } from "@/entities/finals/exam-table.entity";
import { Subject } from "@/entities/subjects/subject.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";

import { FinalExamTableService } from "./services/final-exam-table.service";
import { FinalExamService } from "./services/final-exam.service";
import { FinalExamTableController } from "./controllers/final-exam-table.controller";
import { FinalExamController } from "./controllers/final-exam.controller";
import { Student } from "@/entities/users/student.entity";
import { FinalExamStatus } from "@/entities/finals/final-exam-status.entity";
import { Teacher } from "@/entities/users/teacher.entity";
import { Secretary } from "@/entities/users/secretary.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamTable,
      FinalExam,
      FinalExamsStudent,
      Subject,
      SubjectStudent,
      Student,
      FinalExamStatus,
      Teacher,
      Secretary,
    ]),
  ],
  controllers: [FinalExamTableController, FinalExamController],
  providers: [FinalExamTableService, FinalExamService],
  exports: [FinalExamTableService, FinalExamService],
})
export class FinalExamsModule {}





