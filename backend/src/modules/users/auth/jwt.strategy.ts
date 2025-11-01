import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "./auth.service";
import {
  ROLE,
  ROLE_IDS,
  getRoleById,
  normalizeRole,
  isRole,
} from "@/shared/rbac/roles.constants";

type JwtPayload = {
  sub: string;
  email: string;
  role?: ROLE;
  roleId?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "siaade-secret-key-2025",
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    const roleFromUser = normalizeRole(user.role?.name);
    const roleFromPayload = isRole(payload.role) ? payload.role : null;
    const roleFromId = getRoleById(user.role?.id ?? payload.roleId ?? null);

    const role: ROLE | null = roleFromUser ?? roleFromPayload ?? roleFromId;
    if (!role) {
      throw new UnauthorizedException("User without role assigned");
    }

    const roleId = ROLE_IDS[role];
    const isDirective =
      user.secretary?.isDirective ?? role === ROLE.EXECUTIVE_SECRETARY;

    return {
      id: user.id,
      email: user.email,
      role,
      roleId,
      isDirective,
    };
  }
}

