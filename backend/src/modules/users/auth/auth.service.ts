import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { User } from "../../../entities/users.entity";
import { Role } from "../../../entities/roles.entity";
import { UserProfileReaderService } from "@/shared/services/user-profile-reader/user-profile-reader.service";
import { UserAuthValidatorService } from "@/shared/services/user-auth-validator/user-auth-validator.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly userAuthValidator: UserAuthValidatorService,
    private readonly userReader: UserProfileReaderService
  ) {}

  async login(loginDto: LoginDto) {
    const idOrResult = await this.userAuthValidator.validateUser(
      loginDto.email,
      loginDto.password
    );

    if (!idOrResult) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const profile = await this.userReader.findById(idOrResult);
    const roleName = profile.role?.name;
    const roleId = profile.role?.id;

    const payload = {
      sub: profile.id,
      email: profile.email,
      role: roleName,
      roleId: roleId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: "1h" });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    return {
      profile,
      accessToken,
      refreshToken,
      tokenType: "Bearer",
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ["role"],
      });

      if (!user) {
        throw new UnauthorizedException("Invalid token");
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        roleId: user.roleId,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: "1h",
      });

      return {
        accessToken: newAccessToken,
        tokenType: "Bearer",
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  async validateUser(userId: string) {
    return await this.userRepository.findOne({
      where: { id: userId },
      relations: ["role", "secretary"],
    });
  }

  async validateUserById(userId: string) {
    return this.validateUser(userId);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: resetPasswordDto.email },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Aquí implementarías la lógica para enviar email de reset
    // Por ahora solo retornamos un mensaje
    return {
      message: "Password reset instructions sent to your email",
      email: resetPasswordDto.email,
    };
  }
}
