import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Student } from "@/entities/users/student.entity";
import { FinalExamsStudent } from "@/entities/finals/final-exams-student.entity";
import { PdfGeneratorController } from "@/modules/pdf-generator/pdf-generator.controller";
import { PdfGeneratorService } from "@/modules/pdf-generator/pdf-generator.service";
import { PdfEngineService } from "@/modules/pdf-generator/pdf-engine.service";
import { CatalogsModule } from "@/modules/catalogs/catalogs.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, FinalExamsStudent]),
    CatalogsModule,
  ],
  controllers: [PdfGeneratorController],
  providers: [PdfGeneratorService, PdfEngineService],
  exports: [PdfGeneratorService],
})
export class PdfGeneratorModule {}
