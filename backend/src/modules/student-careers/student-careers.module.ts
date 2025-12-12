import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StudentCareersController } from "./student-careers.controller";
import { StudentCareersService } from "./student-careers.service";
import { Career } from "@/entities/registration/career.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";
import { Student } from "@/entities/users/student.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Career,
      CareerStudent,
      CareerSubject,
      SubjectCommission,
      SubjectStudent,
      Student,
    ]),
  ],
  controllers: [StudentCareersController],
  providers: [StudentCareersService],
  exports: [StudentCareersService],
})
export class StudentCareersModule {}
