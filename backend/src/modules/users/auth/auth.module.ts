import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { User } from "@/entities/users/user.entity";
import { Student } from "@/entities/users/student.entity";
import { Role } from "@/entities/roles/role.entity";
import { UserAuthValidatorModule } from "@/shared/services/user-auth-validator/user-auth-validator.module";
import { UserProfileReaderModule } from "@/shared/services/user-profile-reader/user-profile-reader.module";
import { PasswordResetToken } from "@/entities/users/password-reset-token.entity";
import { RateLimitService } from "@/shared/services/rate-limit/rate-limit.service";
import { PasswordResetCleanupService } from "./password-reset-cleanup.service";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Role, Student, PasswordResetToken]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("JWT_ACCESS_TTL") || "15m",
        },
      }),
    }),
    UserAuthValidatorModule,
    UserProfileReaderModule,
  ],
  providers: [AuthService, JwtStrategy, RateLimitService, PasswordResetCleanupService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}


