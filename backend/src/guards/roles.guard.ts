import { Injectable, Logger } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../modules/users/auth/roles.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { normalizeRequiredRoles, toCanonicalRole } from '../shared/utils/roles.util';

@Injectable()
export class RolesGuard extends JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
  const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
  if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
  if (!user || !user.role || !user.role.name) {
      this.logger.warn(`Denied: user or role missing`);
      return false;
    }
  const canonicalUser = toCanonicalRole(user.role.name, { isDirective: user.isDirective });
  const requiredCanonical = normalizeRequiredRoles(requiredRoles);
  if (!canonicalUser) {
      this.logger.warn(`Denied: cannot map user role '${user.role.name}' (isDirective=${user.isDirective ?? false})`);
      return false;
    }
  const allowed = requiredCanonical.includes(canonicalUser) || canonicalUser === 'ADMIN_GENERAL' || canonicalUser === 'SECRETARIO_DIRECTIVO';
  if (!allowed) {
      this.logger.warn(`Denied: user=${canonicalUser} required=${requiredCanonical.join(',')}`);
    }
  return allowed;
  }
}
