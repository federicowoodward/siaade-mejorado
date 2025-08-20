import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './login.dto';
import { User } from '../../../entities/user.entity';
import { Role } from '../../../entities/role.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // Buscar usuario por email incluyendo el rol
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validar contraseña
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generar JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
    };

    // Generar tokens
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        role: user.role.name,
      },
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['role'],
      });

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role.name,
        roleId: user.roleId,
      };

      const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: '1h' });

      return {
        accessToken: newAccessToken,
        tokenType: 'Bearer',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(userId: string) {
    return await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
  }
}