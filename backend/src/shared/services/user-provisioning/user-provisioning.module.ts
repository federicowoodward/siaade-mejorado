// src/shared/services/user-provisioning/user-provisioning.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@/entities/users/user.entity";
import { Role } from "@/entities/roles/role.entity";
import { UserInfo } from "@/entities/users/user-info.entity";
import { CommonData } from "@/entities/users/common-data.entity";
import { AddressData } from "@/entities/users/address-data.entity";
import { Student } from "@/entities/users/student.entity";
import { Teacher } from "@/entities/users/teacher.entity";
import { Preceptor } from "@/entities/users/preceptor.entity";
import { Secretary } from "@/entities/users/secretary.entity";

import { UserProvisioningService } from "./user-provisioning.service";

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
  providers: [UserProvisioningService],
  exports: [UserProvisioningService],
})
export class UserProvisioningModule {}
