import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { User } from "../../../entities/users.entity";
import { Role } from "../../../entities/roles.entity";
import { AuthModule } from "../auth/auth.module";
import { UserProvisioningModule } from "../../../shared/services/user-provisioning/user-provisioning.module";
import { UserProfileReaderModule } from "../../../shared/services/user-profile-reader/user-profile-reader.module";
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    forwardRef(() => AuthModule),
    UserProvisioningModule,
    UserProfileReaderModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
