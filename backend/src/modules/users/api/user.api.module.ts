import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../entities/users.entity';
import { Secretary } from '../../../entities/secretaries.entity';
import { Preceptor } from '../../../entities/preceptors.entity';
import { Teacher } from '../../../entities/teachers.entity';
import { Student } from '../../../entities/students.entity';
import { UserInfo } from '../../../entities/user_info.entity';
import { CommonData } from '../../../entities/common_data.entity';
import { AddressData } from '../../../entities/address_data.entity';
import { Role } from '../../../entities/roles.entity';
import { UserApiService } from './user.api.service';
import { UserApiController } from './user.api.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Secretary, Preceptor, Teacher, Student, UserInfo, CommonData, AddressData, Role])],
  controllers: [UserApiController],
  providers: [UserApiService],
})
export class UserApiModule {}
