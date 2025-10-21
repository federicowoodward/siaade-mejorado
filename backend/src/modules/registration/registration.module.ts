import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationController } from '@/modules/registration/registration.controller';
import { RegistrationService } from '@/modules/registration/registration.service';
import { RegistrationEnrollment, RegistrationStage, RegistrationStageType } from '@/entities/registration/registration-stage.entity';
import { Career } from '@/entities/registration/career.entity';
import { SubjectCommission } from '@/entities/subjects/subject-commission.entity';
import { Student } from '@/entities/users/student.entity';
import { Secretary } from '@/entities/users/secretary.entity';

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




