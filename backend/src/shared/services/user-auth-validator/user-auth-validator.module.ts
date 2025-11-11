// src/shared/services/user-auth-validator/user-auth-validator.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@/entities/users/user.entity";
import { Role } from "@/entities/roles/role.entity";
import { UserAuthValidatorService } from "./user-auth-validator.service";

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [UserAuthValidatorService],
  exports: [UserAuthValidatorService], 
})
export class UserAuthValidatorModule {}

