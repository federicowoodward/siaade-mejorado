import { Injectable, Logger, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../modules/users/auth/roles.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";
import {
  CanonicalRole,
  normalizeRequiredRoles,
  toCanonicalRole,
} from "../shared/utils/roles.util";
import {
  ALL_ROLE_NAMES,
  CANONICAL_TO_ROLE,
  RoleName,
} from "@/shared/constants/roles";

type AuthenticatedUser = {
  id: string;
  roleId?: number;
  roleName?: string;
  role?: { id?: number; name?: string } | string;
  isDirective?: boolean;
};

@Injectable()
export class RolesGuard extends JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRolesRaw =
      this.reflector.get<string[] | undefined>(ROLES_KEY, context.getHandler()) ?? [];
    const requiredRoles = requiredRolesRaw
      .map((role) => role?.toString().trim().toLowerCase())
      .filter(Boolean) as RoleName[];

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const jwtOk = await super.canActivate(context);
    if (!jwtOk) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      this.logger.warn("Denied: unauthenticated request");
      return false;
    }

    const rawRoleName = this.extractRoleName(user);
    const canonical = toCanonicalRole(rawRoleName, {
      isDirective: user.isDirective,
    });

    if (canonical === "ADMIN_GENERAL") {
      return true;
    }
    if (canonical === "SECRETARIO_DIRECTIVO") {
      return true;
    }

    const normalizedRole = this.normalizeRoleName(rawRoleName, canonical);
    if (!normalizedRole) {
      this.logger.warn(
        `Denied: cannot map role (raw='${rawRoleName}', canonical='${canonical}')`
      );
      return false;
    }

    const requiredCanonical = normalizeRequiredRoles(requiredRolesRaw);
    const userCanonical = toCanonicalRole(normalizedRole, {
      isDirective: user.isDirective,
    });

    const allowed =
      requiredRoles.includes(normalizedRole) ||
      (userCanonical !== undefined &&
        requiredCanonical.includes(userCanonical));

    if (!allowed) {
      this.logger.warn(
        `Denied: userRole=${normalizedRole} required=${requiredRoles.join(",")}`
      );
    }

    return allowed;
  }

  private extractRoleName(user: AuthenticatedUser): string | undefined {
    if (typeof user.roleName === "string") {
      return user.roleName;
    }
    if (typeof user.role === "string") {
      return user.role;
    }
    if (user.role && typeof user.role.name === "string") {
      return user.role.name;
    }
    return undefined;
  }

  private normalizeRoleName(
    roleName: string | undefined,
    canonical?: CanonicalRole
  ): RoleName | undefined {
    if (roleName) {
      const lower = roleName.trim().toLowerCase();
      if ((ALL_ROLE_NAMES as string[]).includes(lower)) {
        return lower as RoleName;
      }
    }
    if (canonical && CANONICAL_TO_ROLE[canonical]) {
      return CANONICAL_TO_ROLE[canonical];
    }
    return undefined;
  }
}

