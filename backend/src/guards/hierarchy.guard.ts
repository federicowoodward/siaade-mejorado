import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { ROLE, getRoleById, isRole } from "@/shared/rbac/roles.constants";

@Injectable()
export class HierarchyGuard extends JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetId: string | undefined =
      request.params?.id || request.body?.id || request.body?.userId;
    const role = this.resolveRole(user);

    if (!role) {
      return false;
    }

    if (role === ROLE.EXECUTIVE_SECRETARY) {
      return true;
    }

    if (role === ROLE.SECRETARY || role === ROLE.PRECEPTOR) {
      return true;
    }

    if (
      (role === ROLE.TEACHER || role === ROLE.STUDENT) &&
      targetId &&
      user?.id === targetId
    ) {
      return true;
    }

    return false;
  }

  private resolveRole(user: any): ROLE | null {
    if (!user) return null;
    if (isRole(user.role)) return user.role;
    if (user.roleId != null) {
      return getRoleById(Number(user.roleId));
    }
    return null;
  }
}

