import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy'; // Estrategia personalizada de JWT
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/manage/users.module';  // Asegúrate de tener acceso al módulo de usuarios

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'SECRET_KEY', // Esto debería ser más seguro en producción
      signOptions: { expiresIn: '3600s' }, // Duración del token en segundos
    }),
    UsersModule, // Para obtener el servicio de usuarios
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
