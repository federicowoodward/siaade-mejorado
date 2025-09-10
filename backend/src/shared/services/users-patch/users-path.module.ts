// src/shared/services/user-provisioning/user-provisioning.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../../../entities/users.entity";
import { Role } from "../../../entities/roles.entity";
import { UserInfo } from "../../../entities/user_info.entity";
import { CommonData } from "../../../entities/common_data.entity";
import { AddressData } from "../../../entities/address_data.entity";
import { Student } from "../../../entities/students.entity";
import { Teacher } from "../../../entities/teachers.entity";
import { Preceptor } from "../../../entities/preceptors.entity";
import { Secretary } from "../../../entities/secretaries.entity";
import { UsersPatchService } from "./users-patch.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      UserInfo,
      CommonData,
      AddressData,
      Student,
      Teacher,
      Preceptor,
      Secretary,
    ]),
  ],
  providers: [UsersPatchService],
  exports: [UsersPatchService],
})
export class UsersPatchModule {}
