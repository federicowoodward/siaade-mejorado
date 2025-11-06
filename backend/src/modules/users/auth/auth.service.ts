import { BadRequestException, Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, MoreThan, Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ConfirmResetPasswordDto } from "./dto/confirm-reset-password.dto";
import { VerifyResetCodeDto } from "./dto/verify-reset-code.dto";
import { User } from "@/entities/users/user.entity";
import { Student } from "@/entities/users/student.entity";
import { PasswordResetToken } from "@/entities/users/password-reset-token.entity";
import { UserProfileReaderService } from "@/shared/services/user-profile-reader/user-profile-reader.service";
import { PasswordHistory } from "@/entities/users/password-history.entity";
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
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshSecret: string;
  private readonly refreshTtl: string;
  private readonly refreshTtlMs: number;
  private readonly accessTtl: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(PasswordResetToken)
    private readonly prtRepository: Repository<PasswordResetToken>,
    @InjectRepository(PasswordHistory)
    private readonly passwordHistoryRepo: Repository<PasswordHistory>,
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
      loginDto.identity,
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
    const id = (resetPasswordDto.identity || "").trim();

    const user = await this.resolveUserByIdentity(id);
    if (!user) {
      // No revelar si existe o no; mantenemos mensaje genérico
      return { message: "Si la cuenta existe, enviamos instrucciones" };
    }

    const { token, expiresInSeconds, code, codeExpiresInSeconds } = await this.issueResetToken(user.id);

    // En modo seguro: no exponemos detalles en producción salvo que se habilite por bandera
    const isProd = (this.configService.get<string>("NODE_ENV") || "").toLowerCase() === "production";
    // Permitir alias de variable por compatibilidad: RESET_DETAILS_EXPOSE_IN_RESPONSE o RESET_TOKEN_EXPOSE_IN_RESPONSE
    const exposeEnv =
      this.configService.get<string>("RESET_DETAILS_EXPOSE_IN_RESPONSE") ??
      this.configService.get<string>("RESET_TOKEN_EXPOSE_IN_RESPONSE");
    const expose = String(exposeEnv).toLowerCase() === "true";
    if (isProd && !expose) {
      return { message: "Si la cuenta existe, enviamos instrucciones." };
    }

    // En dev/QA (o bandera habilitada), devolvemos detalles para facilitar el flujo sin correo
    this.logger.log(`DEV ONLY: Reset code for userId=${user.id} code=${code}`);
    return { message: "Código generado", token, expiresInSeconds, code, codeExpiresInSeconds };
  }

  async confirmResetPassword(dto: ConfirmResetPasswordDto) {
    const rawToken = (dto.token || "").trim();
    const newPassword = (dto.password || "").trim();

    if (!rawToken || !newPassword) {
      throw new BadRequestException("Token y contraseña son requeridos");
    }

    const tokenHash = this.sha256(rawToken);
    const now = new Date();

    const record = await this.prtRepository.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
    });

    if (!record) {
      throw new UnauthorizedException("Token inválido o expirado");
    }

    // Cargar usuario actual
    const user = await this.userRepository.findOne({ where: { id: record.userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const bcrypt = await import("bcryptjs");

    // Si envió contraseña actual, validarla explícitamente
    if (dto.currentPassword) {
      const ok = await bcrypt.compare(dto.currentPassword, user.password);
      if (!ok) {
        throw new UnauthorizedException("Contraseña actual incorrecta");
      }
    }

    // No permitir reutilizar la contraseña vigente
    const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
    if (isSameAsCurrent) {
      throw new BadRequestException("La nueva contraseña no puede ser igual a la actual");
    }

    // No permitir reutilizar una contraseña histórica (últimas 10 por performance)
    const last10 = await this.passwordHistoryRepo.find({
      where: { userId: user.id },
      order: { createdAt: "DESC" },
      take: 10,
    });
    for (const entry of last10) {
      if (await bcrypt.compare(newPassword, entry.passwordHash)) {
        throw new BadRequestException("Ya usaste esa contraseña anteriormente. Elegí una diferente.");
      }
    }

    // Guardar la contraseña actual en historial antes de actualizar
    await this.passwordHistoryRepo.insert({ userId: user.id, passwordHash: user.password } as any);

    // Actualizar contraseña del usuario (hash bcrypt)
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update({ id: user.id }, { password: hashed });

    // Marcar token como usado y anular otros tokens activos del usuario
    const usedAt = new Date();
    await this.prtRepository.update({ id: record.id }, { usedAt });
    await this.prtRepository
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ usedAt })
      .where("user_id = :uid", { uid: record.userId })
      .andWhere("used_at IS NULL")
      .andWhere("expires_at > :now", { now })
      .andWhere("id <> :id", { id: record.id })
      .execute();

    this.logger.log(`Password reset confirm: userId=${record.userId} tokenHash=${tokenHash.substring(0,8)}...`);

    return { success: true };
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

    // Gating de acceso para alumnos: isActive=false bloquea siempre; si isActive=true pero canLogin=false, también bloquea login.
    if (role === ROLE.STUDENT) {
      // Traer flags del alumno; como las columnas pueden ser null, sólo bloqueamos si son estrictamente false
      const student = await this.studentRepository.findOne({ where: { userId } });
      if (!student) {
        throw new UnauthorizedException("Student record not found");
      }
      if (student.isActive === false) {
        throw new UnauthorizedException("Student is inactive");
      }
      if (student.canLogin === false) {
        throw new UnauthorizedException("Login disabled for this student");
      }
    }

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

  private async issueResetToken(userId: string): Promise<{
    token: string;
    expiresInSeconds: number;
    code: string;
    codeExpiresInSeconds: number;
  }> {
    const token = this.generateToken();
    const tokenHash = this.sha256(token);
    const ttl = this.configService.get<number>("RESET_TOKEN_TTL_SECONDS") ?? 30 * 60; // 30 min por defecto
    const expiresAt = new Date(Date.now() + ttl * 1000);
    // Generar código de 6 dígitos para flujo alternativo
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const codeHash = this.sha256(code);
    const codeTtl = this.configService.get<number>("RESET_CODE_TTL_SECONDS") ?? 10 * 60; // 10 min por defecto
    const codeExpiresAt = new Date(Date.now() + codeTtl * 1000);

    const entity = this.prtRepository.create({
      userId,
      tokenHash,
      expiresAt,
      usedAt: null,
      codeHash,
      codeExpiresAt,
    });
    await this.prtRepository.save(entity);

    this.logger.log(`Password reset token issued: userId=${userId} tokenHash=${tokenHash.substring(0,8)}... ttl=${ttl}s`);

    return { token, expiresInSeconds: ttl, code, codeExpiresInSeconds: codeTtl };
  }

  private generateToken(size = 32): string {
    const nodeCrypto = require("crypto");
    return nodeCrypto.randomBytes(size).toString("hex"); // 64 chars hex
  }

  private sha256(input: string): string {
    const nodeCrypto = require("crypto");
    return nodeCrypto.createHash("sha256").update(input).digest("hex");
  }

  private async resolveUserByIdentity(id: string): Promise<User | null> {
    let user: User | null = null;
    if (id.includes("@")) {
      user = await this.userRepository.findOne({ where: { email: id } });
    }
    if (!user && /^\d{8,}$/.test(id)) {
      user = await this.userRepository.findOne({ where: { cuil: id } });
    }
    if (!user) {
      const full = id.toLowerCase().replace(/\s+/g, " ").trim();
      if (full) {
        user = await this.userRepository
          .createQueryBuilder("u")
          .where(
            "LOWER(CONCAT(TRIM(u.name), ' ', TRIM(u.last_name))) = :full",
            { full }
          )
          .getOne();
      }
    }
    return user;
  }

  async verifyResetCode(dto: VerifyResetCodeDto): Promise<{ token: string; expiresInSeconds: number }> {
    const identity = (dto.identity || "").trim();
    const code = (dto.code || "").trim();
    if (!identity || !/^\d{6}$/.test(code)) {
      throw new BadRequestException("Identidad o código inválidos");
    }

    const user = await this.resolveUserByIdentity(identity);
    if (!user) {
      // No revelar existencia
      throw new UnauthorizedException("Código inválido o expirado");
    }

    const now = new Date();
    const codeHash = this.sha256(code);
    // Buscar un token con ese codeHash, vigente y sin usar
    const record = await this.prtRepository.findOne({
      where: {
        userId: user.id,
        usedAt: IsNull(),
      },
      order: { createdAt: "DESC" },
    });

    if (!record || !record.codeHash || record.codeHash !== codeHash || !record.codeExpiresAt || record.codeExpiresAt <= now) {
      throw new UnauthorizedException("Código inválido o expirado");
    }

    // Invalida el código actual para evitar reutilización
    await this.prtRepository.update({ id: record.id }, { usedAt: now });

    // Emitir un nuevo token one-time para el reseteo
    const { token, expiresInSeconds } = await this.issueResetToken(user.id);
    this.logger.log(`Reset code verificado: userId=${user.id} codeHash=${codeHash.substring(0,8)}...`);
    return { token, expiresInSeconds };
  }
}
