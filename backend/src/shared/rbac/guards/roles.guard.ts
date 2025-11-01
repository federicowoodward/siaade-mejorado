import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ALLOW_ROLES_KEY } from "../decorators/allow-roles.decorator";
import { ACTION_KEY } from "../decorators/action.decorator";
import { ROLE, isRole } from "../roles.constants";

type RequestUser = {
  id?: string;
  email?: string;
  role?: ROLE;
  roleId?: number;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const handlerRoles =
      this.reflector.getAllAndOverride<ROLE[]>(ALLOW_ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];

    if (!handlerRoles.length) {
      return true;
    }

    const request = ctx.switchToHttp().getRequest();
    const user = (request?.user ?? {}) as RequestUser;
    const role = isRole(user.role) ? user.role : null;
    const action =
      this.reflector.getAllAndOverride<string>(ACTION_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? "";

    const allowed = role !== null && handlerRoles.includes(role);

    if (!allowed && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[RBAC DENY][DEV]", {
        email: user.email ?? null,
        userId: user.id ?? null,
        role,
        action,
        allowedRoles: handlerRoles,
        method: request?.method ?? null,
        path: request?.route?.path ?? request?.url ?? null,
      });
    }

    return allowed;
  }
}

