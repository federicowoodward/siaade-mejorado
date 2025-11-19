import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Career } from "@/entities/registration/career.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { CareerStudentsController } from "./career-students.controller";
import { CareerStudentsService } from "./career-students.service";

@Module({
  imports: [TypeOrmModule.forFeature([Career, CareerStudent])],
  controllers: [CareerStudentsController],
  providers: [CareerStudentsService],
})
export class CareersModule {}
