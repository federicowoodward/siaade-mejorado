import { inject, isDevMode } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { PermissionService } from '../auth/permission.service';
import { ROLE } from '../auth/roles';

function createGuardResult(
  allowed: ROLE[],
  current: ROLE | null,
  router: Router
): boolean | UrlTree {
  if (!allowed.length) return true;
  if (current && allowed.includes(current)) {
    return true;
  }

  if (isDevMode()) {
    // eslint-disable-next-line no-console
    console.warn('[RBAC][Front][DENY]', {
      allowed,
      current,
    });
  }

  return router.parseUrl('/welcome');
}

export const roleCanMatch =
  (allowed: ROLE[]): CanMatchFn =>
  () => {
    const permissions = inject(PermissionService);
    const router = inject(Router);
    const current = permissions.currentRole();
    return createGuardResult(allowed, current, router);
  };

export const roleCanActivate =
  (allowed: ROLE[]): CanActivateFn =>
  () => {
    const permissions = inject(PermissionService);
    const router = inject(Router);
    const current = permissions.currentRole();
    return createGuardResult(allowed, current, router);
  };
