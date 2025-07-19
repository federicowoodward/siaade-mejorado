import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
import { JwtPayload } from './jwt.payload';  // El tipo de payload que contiene el JWT
import { UsersService } from '../users/users.service'; // Para obtener los datos del usuario
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      secretOrKey: 'SECRET_KEY',  // El secreto de la aplicación para validar el JWT
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),  // Extrae el JWT desde el header 'Authorization'
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepository.findOne(payload.sub);  // Busca al usuario usando el ID del JWT
    return user;
  }
}