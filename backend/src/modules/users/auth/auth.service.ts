import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { User } from "@/entities/users/user.entity";
import { UserProfileReaderService } from "@/shared/services/user-profile-reader/user-profile-reader.service";
import { UserAuthValidatorService } from "@/shared/services/user-auth-validator/user-auth-validator.service";
import {
  ROLE,
  ROLE_IDS,
  getRoleById,
  normalizeRole,
} from "@/shared/rbac/roles.constants";

type AuthPayload = {
  sub: string;
  email: string;
  role: ROLE;
  roleId: number;
  isDirective: boolean;
};

type AuthProfile = Awaited<ReturnType<UserProfileReaderService["findById"]>>;

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshTtl: string;
  private readonly refreshTtlMs: number;
  private readonly accessTtl: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly userAuthValidator: UserAuthValidatorService,
    private readonly userReader: UserProfileReaderService,
    private readonly configService: ConfigService
  ) {
    this.refreshSecret =
      this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
    this.refreshTtl = this.configService.get<string>("JWT_REFRESH_TTL") || "1d";
    this.refreshTtlMs = this.parseDurationToMs(this.refreshTtl);
    this.accessTtl = this.configService.get<string>("JWT_ACCESS_TTL") || "15m";
  }

  async login(loginDto: LoginDto) {
    const userId = await this.userAuthValidator.validateUser(
      loginDto.email,
      loginDto.password
    );

    if (!userId) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const { profile, payload } = await this.resolveProfileAndPayload(userId);
    const { accessToken, refreshToken } = this.issueTokens(payload);

    return {
      user: profile,
      accessToken,
      refreshToken,
      tokenType: "Bearer",
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("Missing refresh token");
    }

    let incomingPayload: AuthPayload;
    try {
      incomingPayload = this.jwtService.verify<AuthPayload>(refreshToken, {
        secret: this.refreshSecret,
        clockTolerance: 30,
      });
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const { profile, payload } = await this.resolveProfileAndPayload(
      incomingPayload.sub
    );

    const { accessToken, refreshToken: rotatedRefreshToken } =
      this.issueTokens(payload);

    return {
      user: profile,
      accessToken,
      refreshToken: rotatedRefreshToken,
      tokenType: "Bearer",
    };
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

  getRefreshCookieLifetimeMs(): number {
    return this.refreshTtlMs;
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

  private issueTokens(payload: AuthPayload) {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.accessTtl,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshTtl,
    });

    return { accessToken, refreshToken };
  }

  private async resolveProfileAndPayload(userId: string): Promise<{
    profile: AuthProfile;
    payload: AuthPayload;
  }> {
    const profile = await this.userReader.findById(userId);

    if (!profile) {
      throw new UnauthorizedException("User not found");
    }

    const userEntity = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["role", "secretary"],
    });

    if (!userEntity) {
      throw new UnauthorizedException("User not found");
    }

    const roleFromProfile = normalizeRole(profile.role?.name);
    const roleIdFromProfile = profile.role?.id ?? null;
    const roleFromEntity =
      normalizeRole(userEntity.role?.name) ?? getRoleById(userEntity.roleId);
    const role =
      roleFromProfile ?? roleFromEntity ?? getRoleById(roleIdFromProfile);

    if (!role) {
      throw new UnauthorizedException("User without role assigned");
    }

    const roleId = ROLE_IDS[role];
    const isDirective =
      userEntity.secretary?.isDirective ?? role === ROLE.EXECUTIVE_SECRETARY;

    const email = profile.email ?? userEntity.email ?? null;
    if (!email) {
      throw new UnauthorizedException("User without email");
    }

    const payload: AuthPayload = {
      sub: profile.id,
      email,
      role,
      roleId,
      isDirective,
    };

    return { profile, payload };
  }

  private parseDurationToMs(value: string): number {
    const trimmed = value.trim();
    const numericValue = Number(trimmed);
    if (!Number.isNaN(numericValue) && numericValue >= 0) {
      return numericValue * 1000;
    }

    const match = /^(\d+)\s*(s|m|h|d)?$/i.exec(trimmed);
    if (!match) {
      return 0;
    }

    const amount = Number(match[1]);
    const unit = (match[2] ?? "s").toLowerCase();

    const unitToMs: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const multiplier = unitToMs[unit] ?? unitToMs.s;
    return amount * multiplier;
  }
}
