// src/modules/final_exams/final_exams.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FinalExam } from "../../entities/final_exam.entity";
import { FinalExamsStudent } from "../../entities/final_exams_student.entity";
import { FinalExamTable } from "../../entities/final_exam_table.entity";
import { Subject } from "../../entities/subjects.entity";
import { SubjectStudent } from "../../entities/subject_student.entity";

import { FinalExamTableService } from "./services/final-exam-table.service";
import { FinalExamService } from "./services/final-exam.service";
import { FinalExamTableController } from "./controllers/final-exam-table.controller";
import { FinalExamController } from "./controllers/final-exam.controller";
import { Student } from "@/entities/students.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinalExamTable,
      FinalExam,
      FinalExamsStudent,
      Subject,
      SubjectStudent,
      Student,
    ]),
  ],
  controllers: [FinalExamTableController, FinalExamController],
  providers: [FinalExamTableService, FinalExamService],
  exports: [FinalExamTableService, FinalExamService],
})
export class FinalExamsModule {}
