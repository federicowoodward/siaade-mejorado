// src/modules/users/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './login.dto';  // El DTO para el login
import { ResetPasswordDto } from './reset-password.dto';  // El DTO para el reset de contraseña

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    // Aquí debes implementar la lógica para validar las credenciales del usuario
    const user = { id: 'user-id', email: loginDto.email };  // Esto es solo un ejemplo

    // Generar el JWT
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),  // Devuelve el token JWT
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // Lógica para restablecer la contraseña
    // Por ejemplo, enviar un correo de restablecimiento con un código o enlace
    return { message: 'Password reset instructions sent to your email.' };
  }
}