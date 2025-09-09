import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { User } from "../../../entities/users.entity";
import { Role } from "../../../entities/roles.entity";
import { UserAuthValidatorModule } from "@/shared/services/user-auth-validator/user-auth-validator.module";
import { UserProfileReaderModule } from "@/shared/services/user-profile-reader/user-profile-reader.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "siaade-secret-key-2025",
      signOptions: { expiresIn: "1h" },
    }),
    UserAuthValidatorModule,
    UserProfileReaderModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
