import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogsController } from "./catalogs.controller";
import { CatalogsService } from "./catalogs.service";
import { AcademicPeriod } from "@/entities/catalogs/academic-period.entity";
import { Career } from "@/entities/registration/career.entity";
import { Commission } from "@/entities/catalogs/commission.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { Student } from "@/entities/users/student.entity";
import { FinalExamStatus } from "@/entities/finals/final-exam-status.entity";
import { SubjectStatusType } from "@/entities/catalogs/subject-status-type.entity";
import { Subject } from "@/entities/subjects/subject.entity";
import { SubjectGradesView } from "@/subjects/views/subject-grades.view";
import { Teacher } from "@/entities/users/teacher.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AcademicPeriod,
      Career,
      Commission,
      Subject,
      SubjectGradesView,
      SubjectCommission,
      CareerSubject,
      CareerStudent,
      Teacher,
      Student,
      FinalExamStatus,
      SubjectStatusType,
    ]),
  ],
  controllers: [CatalogsController],
  providers: [CatalogsService],
})
export class CatalogsModule {}

