import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationController } from '@/modules/registration/registration.controller';
import { RegistrationService } from '@/modules/registration/registration.service';
import { RegistrationEnrollment, RegistrationStage, RegistrationStageType } from '@/entities/registration_stage.entity';
import { Career } from '@/entities/careers.entity';
import { SubjectCommission } from '@/entities/subject_commissions.entity';
import { Student } from '@/entities/students.entity';
import { Secretary } from '@/entities/secretaries.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistrationStageType,
      RegistrationStage,
      RegistrationEnrollment,
      Career,
      SubjectCommission,
      Student,
      Secretary,
    ]),
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
