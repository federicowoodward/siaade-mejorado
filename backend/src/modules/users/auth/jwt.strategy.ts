import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { toCanonicalRole } from '../../../shared/utils/roles.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'siaade-secret-key-2025',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    const isDirective = user.secretary?.isDirective ?? false;
    const canonical = toCanonicalRole(user.role?.name, { isDirective });
    return {
      id: user.id,
      email: user.email,
  role: { name: (canonical ?? user.role?.name) as string },
      roleId: user.roleId,
      isDirective,
    };
  }
}
