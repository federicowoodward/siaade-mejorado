// src/shared/services/user-profile-reader/user-profile-reader.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../../../entities/users.entity";
import { Role } from "../../../entities/roles.entity";
import { UserInfo } from "../../../entities/user_info.entity";
import { CommonData } from "../../../entities/common_data.entity";
import { AddressData } from "../../../entities/address_data.entity";
import { UserProfileReaderService } from "./user-profile-reader.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserInfo, CommonData, AddressData]),
  ],
  providers: [UserProfileReaderService],
  exports: [UserProfileReaderService],
})
export class UserProfileReaderModule {}
