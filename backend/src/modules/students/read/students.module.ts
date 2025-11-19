import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StudentsReadController } from "@/modules/students/read/students.controller";
import { StudentsReadService } from "@/modules/students/read/students.service";
import { User } from "@/entities/users/user.entity";
import { Student } from "@/entities/users/student.entity";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";
import { Notice } from "@/entities/notices/notice.entity";
import { CatalogsModule } from "@/modules/catalogs/catalogs.module";
import { SubjectGradesView } from "@/subjects/views/subject-grades.view";
import { FinalExam } from "@/entities/finals/final-exam.entity";
import { Role } from "@/entities/roles/role.entity";
import { Subject } from "@/entities/subjects/subject.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Student,
      FinalExamsStudent,
      FinalExam,
      Notice,
      Role,
      Subject,
      SubjectGradesView,
    ]),
    CatalogsModule,
  ],
  controllers: [StudentsReadController],
  providers: [StudentsReadService],
  exports: [StudentsReadService],
})
export class StudentsReadModule {}
