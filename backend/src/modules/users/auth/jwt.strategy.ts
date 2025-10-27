import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "./auth.service";
import { toCanonicalRole } from "../../../shared/utils/roles.util";
import {
  ALL_ROLE_NAMES,
  CANONICAL_TO_ROLE,
  RoleName,
} from "@/shared/constants/roles";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "siaade-secret-key-2025",
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    const isDirective = user.secretary?.isDirective ?? false;
    const roleId = user.role?.id ?? user.roleId ?? null;
    const roleNameRaw = user.role?.name ?? payload.roleName ?? payload.role;
    const normalized = roleNameRaw ? roleNameRaw.trim().toLowerCase() : undefined;

    let roleName: RoleName | undefined;
    if (normalized && (ALL_ROLE_NAMES as string[]).includes(normalized)) {
      roleName = normalized as RoleName;
    } else {
      const canonicalFromRaw = toCanonicalRole(roleNameRaw, { isDirective });
      if (canonicalFromRaw && CANONICAL_TO_ROLE[canonicalFromRaw]) {
        roleName = CANONICAL_TO_ROLE[canonicalFromRaw]!;
      }
    }

    if (!roleId || !roleName) {
      throw new UnauthorizedException("Usuario sin rol asignado");
    }

    const canonical = toCanonicalRole(roleName, { isDirective });

    return {
      id: user.id,
      email: user.email,
      roleId,
      roleName,
      role: { id: roleId, name: roleName },
      canonicalRole: canonical,
      isDirective,
    };
  }
}
