import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);
      return {
        data: result,
        message: 'Login successful'
      };
    } catch (error: any) {
      return {
        error: error?.message || 'Unknown error',
        message: 'Login failed'
      };
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout() {
    return {
      data: { message: 'Logout successful' },
      message: 'Session terminated'
    };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  async refreshToken(@Body() body: { refreshToken: string }) {
    try {
      const result = await this.authService.refreshToken(body.refreshToken);
      return {
        data: result,
        message: 'Token refreshed successfully'
      };
    } catch (error: any) {
      return {
        error: error?.message || 'Unknown error',
        message: 'Token refresh failed'
      };
    }
  }
}
