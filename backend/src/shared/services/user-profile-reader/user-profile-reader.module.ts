// src/shared/services/user-profile-reader/user-profile-reader.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@/entities/users/user.entity";
import { Role } from "@/entities/roles/role.entity";
import { UserInfo } from "@/entities/users/user-info.entity";
import { CommonData } from "@/entities/users/common-data.entity";
import { AddressData } from "@/entities/users/address-data.entity";
import { UserProfileReaderService } from "./user-profile-reader.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserInfo, CommonData, AddressData]),
  ],
  providers: [UserProfileReaderService],
  exports: [UserProfileReaderService],
})
export class UserProfileReaderModule {}
