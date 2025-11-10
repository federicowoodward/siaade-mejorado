import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ConfirmResetPasswordDto } from "./dto/confirm-reset-password.dto";
import { VerifyResetCodeDto } from "./dto/verify-reset-code.dto";
import { Public } from "../../../shared/decorators/public.decorator";
import { JwtAuthGuard } from "@/guards/jwt-auth.guard";
import { UserProfileResult } from "@/shared/services/user-profile-reader/user-profile-reader.types";
import { RateLimitService } from "@/shared/services/rate-limit/rate-limit.service";

type LoginSuccessResponse = {
  accessToken: string;
  user: UserProfileResult;
};

type RefreshSuccessResponse = {
  accessToken: string;
};

const REFRESH_COOKIE_NAME = "rt";
const REFRESH_COOKIE_PATH = "/api/auth/refresh";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimit: RateLimitService
  ) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "User login",
    description:
      "Validates credentials, issues an access token in the response body and stores the refresh token inside an HttpOnly cookie.",
  })
  @ApiBody({
    description: "Login credentials",
    type: LoginDto,
    examples: {
      default: {
        summary: "Example payload",
        value: { email: "executive_secretary@test.com", password: "changeme" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    schema: {
      example: {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        user: {
          id: "user-id",
          email: "executive_secretary@test.com",
          role: { id: 1, name: "EXECUTIVE_SECRETARY" },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid credentials",
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<LoginSuccessResponse> {
    const { accessToken, refreshToken, user } = await this.authService.login(
      loginDto
    );

    this.setRefreshCookie(res, refreshToken);

    return {
      accessToken,
      user: user,
    };
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh access token",
    description:
      "Reads the refresh token from the HttpOnly cookie, rotates it and returns a new access token.",
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: "Token refreshed",
    schema: {
      example: {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Refresh token missing, invalid or expired",
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<RefreshSuccessResponse> {
    const refreshToken = this.extractRefreshToken(req);

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }

    const { accessToken, refreshToken: rotatedToken } =
      await this.authService.refreshToken(refreshToken);

    this.setRefreshCookie(res, rotatedToken);

    return { accessToken };
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "User logout",
    description: "Clears the refresh cookie and ends the current session.",
  })
  @ApiResponse({
    status: 200,
    description: "Logout successful",
  })
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearRefreshCookie(res);
    return { success: true };
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset user password" })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent",
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Req() req: Request) {
    const max = Number(process.env.RESET_RATE_MAX ?? 10);
    const windowMs = Number(process.env.RESET_RATE_WINDOW_MS ?? 15 * 60 * 1000);
    const ip = (req.headers["x-forwarded-for"] as string) || req.ip || "unknown";
    // Fallback: usar identity como clave secundaria para mitigar flood por IP compartida
    const id = (resetPasswordDto.identity || '').trim();
    this.rateLimit.check(`reset:${ip}`, max, windowMs);
    this.rateLimit.check(`reset-id:${id}`, max, windowMs);
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post("reset-password/confirm")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm password reset with token" })
  @ApiResponse({ status: 200, description: "Password reset successful" })
  async confirmReset(@Body() dto: ConfirmResetPasswordDto, @Req() req: Request) {
    const max = Number(process.env.RESET_CONFIRM_RATE_MAX ?? 10);
    const windowMs = Number(process.env.RESET_CONFIRM_RATE_WINDOW_MS ?? 15 * 60 * 1000);
    const ip = (req.headers["x-forwarded-for"] as string) || req.ip || "unknown";
    this.rateLimit.check(`reset-confirm:${ip}`, max, windowMs);
    return this.authService.confirmResetPassword(dto);
  }

  @Public()
  @Post("reset-password/verify-code")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verifica el código de 6 dígitos y emite un token" })
  @ApiResponse({ status: 200, description: "Código verificado" })
  async verifyResetCode(@Body() dto: VerifyResetCodeDto, @Req() req: Request) {
    const max = Number(process.env.RESET_CODE_RATE_MAX ?? 10);
    const windowMs = Number(process.env.RESET_CODE_RATE_WINDOW_MS ?? 15 * 60 * 1000);
    const ip = (req.headers["x-forwarded-for"] as string) || req.ip || "unknown";
    const id = (dto.identity || '').trim();
    this.rateLimit.check(`reset-verify:${ip}`, max, windowMs);
    this.rateLimit.check(`reset-verify-id:${id}`, max, windowMs);
    return this.authService.verifyResetCode(dto);
  }

  // Cambio forzado (primer login) - requiere estar autenticado, por eso NO es @Public
  @Post("password/force-change")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Forzar cambio de contraseña en primer login" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async forceChange(@Req() req: Request, @Body() body: { password: string }) {
  const userId = (req as any).user?.sub || (req as any).user?.id; // payload de JWT
    if (!userId) throw new UnauthorizedException("Missing user in request");
    const pwd = (body?.password || '').trim();
    if (!pwd) throw new BadRequestException('Password requerida');
    return this.authService.forceChangePassword(userId, pwd);
  }

  // Solicitar código para cambio voluntario dentro de sesión
  @Post("password/request-change-code")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Solicita un código para cambio voluntario de contraseña" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async requestChangeCode(@Req() req: Request) {
  const userId = (req as any).user?.sub || (req as any).user?.id;
    if (!userId) throw new UnauthorizedException("Missing user in request");
    // Reutilizamos issueResetToken internamente a través de resetPassword(identity)
    const user = await this.authService.validateUser(userId);
    if (!user) throw new UnauthorizedException('User not found');
    // Llamamos a resetPassword con identidad segura (email)
    const result = await this.authService.resetPassword({ identity: user.email } as any);
    // En entorno dev/test exponemos el code y token para facilitar pruebas sin SMTP.
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return {
        message: result.message,
        code: result.code ?? undefined, // si internamente lo devolviera
        token: result.token ?? undefined,
        expiresInSeconds: result.expiresInSeconds ?? undefined,
        devIdentity: user.email,
      };
    }
    return result;
  }

  // Cambio con código (flujo interno) - requiere currentPassword y code (token ya emitido)
  @Post("password/change-with-code")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirma cambio de contraseña con código dentro de sesión" })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async changeWithCode(@Req() req: Request, @Body() body: { code: string; currentPassword: string; newPassword: string }) {
  const userId = (req as any).user?.sub || (req as any).user?.id;
    if (!userId) throw new UnauthorizedException("Missing user in request");
    const { code, currentPassword, newPassword } = body || {};
    if (!code || !/^[0-9]{6}$/.test(code)) throw new BadRequestException('Código inválido');
    if (!currentPassword || !newPassword) throw new BadRequestException('Contraseñas requeridas');

    // Verificar código generar token temporal luego confirmar con currentPassword
    const user = await this.authService.validateUser(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const verify = await this.authService.verifyResetCode({ identity: user.email, code });
    return this.authService.confirmResetPassword({ token: verify.token, currentPassword, password: newPassword });
  }

  private extractRefreshToken(req: Request): string | null {
    const rawCookieHeader = req.headers.cookie;
    if (!rawCookieHeader) {
      return null;
    }

    const cookies = rawCookieHeader.split(";").map((chunk) => chunk.trim());
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.split("=");
      if (name === REFRESH_COOKIE_NAME) {
        return rest.join("=");
      }
    }

    return null;
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    const maxAge =
      this.authService.getRefreshCookieLifetimeMs() || 24 * 60 * 60 * 1000; // fallback to 24h if parsing fails

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge,
      path: REFRESH_COOKIE_PATH,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.cookie(REFRESH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 0,
      path: REFRESH_COOKIE_PATH,
    });
  }
}
