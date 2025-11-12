import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { User } from "@/entities/users/user.entity";
import { Role } from "@/entities/roles/role.entity";
import { Subject } from "@/entities/subjects/subject.entity";
import { AuthModule } from "../auth/auth.module";
import { UserProvisioningModule } from "../../../shared/services/user-provisioning/user-provisioning.module";
import { UserProfileReaderModule } from "../../../shared/services/user-profile-reader/user-profile-reader.module";
import { UsersPatchModule } from "@/shared/services/users-patch/users-path.module";
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Subject]),
    forwardRef(() => AuthModule),
    UserProvisioningModule,
    UserProfileReaderModule,
    UsersPatchModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
