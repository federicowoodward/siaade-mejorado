import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/manage/users.service';  // Servicio de usuarios
import { LoginDto } from './login.dto';  // El DTO para el login
import { JwtPayload } from './jwt.payload';  // El tipo de payload del JWT
import { User } from '../../entities/users.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // Validar las credenciales del usuario
    const user = await this.usersService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new Error('Invalid credentials');  // Lanza error si las credenciales no son válidas
    }

    // Crear el payload para el JWT
    const payload: JwtPayload = { email: user.email, sub: user.id };
    // Generar el token JWT
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async resetPassword(resetPasswordDto: any) {
    // Implementación básica para resetear contraseña
    // Aquí puedes agregar la lógica para resetear la contraseña
    return { message: 'Password reset functionality not implemented yet' };
  }

  async validateUserById(userId: string): Promise<User | null> {
    // Reutilizamos el repositorio interno del UsersService con relaciones para guards
    try {
      // @ts-ignore: acceso intencional para simplificar wiring sin exponer método
      const repo = this.usersService["usersRepository"] as import('typeorm').Repository<User>;
      return await repo.findOne({ where: { id: userId }, relations: ['role', 'secretary'] });
    } catch {
      // Fallback a método público si cambia la implementación
      const dto = await this.usersService.findById(userId);
      return dto ? ({
        id: dto.id,
        email: dto.email!,
        roleId: dto.roleId,
        role: { id: dto.role?.id!, name: dto.role?.name! } as any,
      } as unknown as User) : null;
    }
  }
}
