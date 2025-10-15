import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogsController } from './catalogs.controller';
import { CatalogsService } from './catalogs.service';
import { AcademicPeriod } from '@/entities/academic_period.entity';
import { Career } from '@/entities/careers.entity';
import { Commission } from '@/entities/commission.entity';
import { SubjectCommission } from '@/entities/subject_commissions.entity';
import { FinalExamStatus } from '@/entities/final_exam_status.entity';
import { SubjectStatusType } from '@/entities/subject_status_type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AcademicPeriod,
      Career,
      Commission,
      SubjectCommission,
      FinalExamStatus,
      SubjectStatusType,
    ]),
  ],
  controllers: [CatalogsController],
  providers: [CatalogsService],
})
export class CatalogsModule {}
