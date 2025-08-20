import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy'; // Estrategia personalizada de JWT
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/manage/users.module';  // Asegúrate de tener acceso al módulo de usuarios
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User]), // Para que JwtStrategy pueda usar el User repository
    JwtModule.register({
      secret: 'SECRET_KEY', // Esto debería ser más seguro en producción
      signOptions: { expiresIn: '3600s' }, // Duración del token en segundos
    }),
    forwardRef(() => UsersModule), // Uso de forwardRef para evitar dependencia circular
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule], // Exportar para que otros módulos puedan usar la estrategia
})
export class AuthModule {}
