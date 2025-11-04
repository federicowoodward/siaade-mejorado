import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ConfirmResetPasswordDto } from "./dto/confirm-reset-password.dto";
import { Public } from "../../../shared/decorators/public.decorator";
import { UserProfileResult } from "@/shared/services/user-profile-reader/user-profile-reader.types";

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
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset user password" })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent",
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post("reset-password/confirm")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Confirm password reset with token" })
  @ApiResponse({ status: 200, description: "Password reset successful" })
  async confirmReset(@Body() dto: ConfirmResetPasswordDto) {
    return this.authService.confirmResetPassword(dto);
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
