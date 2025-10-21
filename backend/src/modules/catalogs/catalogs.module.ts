import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogsController } from './catalogs.controller';
import { CatalogsService } from './catalogs.service';
import { AcademicPeriod } from '@/entities/catalogs/academic-period.entity';
import { Career } from '@/entities/registration/career.entity';
import { Commission } from '@/entities/catalogs/commission.entity';
import { SubjectCommission } from '@/entities/subjects/subject-commission.entity';
import { FinalExamStatus } from '@/entities/finals/final-exam-status.entity';
import { SubjectStatusType } from '@/entities/catalogs/subject-status-type.entity';

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


