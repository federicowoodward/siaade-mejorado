// src/modules/users/auth/reset-password.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';  // Import corregido
import { ResetPasswordDto } from './dto/reset-password.dto';  // El DTO para recibir los datos de restablecimiento

@Controller('reset-password')  // Ruta para restablecer la contraseña
export class ResetPasswordController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);  // Llama al servicio para restablecer la contraseña
  }
}