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

@Module({
  imports: [
    ConfigModule,
  TypeOrmModule.forFeature([User, Role, Student]),
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
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}


