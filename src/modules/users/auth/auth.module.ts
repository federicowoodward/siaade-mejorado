// src/modules/users/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';  // Necesario para la gestión de JWT
import { AuthService } from './auth.service';  // Importa el servicio de autenticación
import { SignInController } from './sign-in.controller';  // Importa el controlador de sign-in
import { ResetPasswordController } from './reset-password.controller';  // Importa el controlador de reset-password
import { JwtStrategy } from './jwt.strategy';  // Estrategia para verificar el JWT (si la necesitas)

@Module({
  imports: [JwtModule.register({ secret: 'SECRET_KEY', signOptions: { expiresIn: '60m' } })],  // Configura el JWT
  providers: [AuthService, JwtStrategy],  // Servicios y estrategias necesarias
  controllers: [SignInController, ResetPasswordController],  // Controladores para la autenticación
})
export class AuthModule {}