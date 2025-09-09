// src/shared/services/user-auth-validator/user-auth-validator.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "@/entities/users.entity";
import { Role } from "@/entities/roles.entity";
import { UserAuthValidatorService } from "./user-auth-validator.service";

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [UserAuthValidatorService],
  exports: [UserAuthValidatorService], 
})
export class UserAuthValidatorModule {}
