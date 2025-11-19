import { inject, isDevMode } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlTree } from '@angular/router';
import { ROLE } from '../auth/roles';
import { AuthService } from '../services/auth.service';
import { RbacService } from '../rbac/rbac.service';

async function resolveRolesGuard(
  allowed: ROLE[],
  router: Router,
  auth: AuthService,
  rbac: RbacService,
): Promise<boolean | UrlTree> {
  if (!allowed.length) {
    return true;
  }

  await auth.ensureSessionLoaded();

  if (rbac.hasAny(allowed)) {
    return true;
  }

  if (rbac.isLoading()) {
    try {
      await rbac.waitUntilReady();
    } catch {
      return router.parseUrl('/auth');
    }
  }

  if (rbac.hasAny(allowed)) {
    return true;
  }

  if (isDevMode()) {
    // eslint-disable-next-line no-console
    console.warn('[RBAC][Front][DENY]', {
      allowed,
      current: rbac.getSnapshot(),
    });
  }

  return router.parseUrl('/welcome');
}

export const roleCanMatch =
  (allowed: ROLE[]): CanMatchFn =>
  async () => {
    const router = inject(Router);
    const auth = inject(AuthService);
    const rbac = inject(RbacService);
    return resolveRolesGuard(allowed, router, auth, rbac);
  };

export const roleCanActivate =
  (allowed: ROLE[]): CanActivateFn =>
  async () => {
    const router = inject(Router);
    const auth = inject(AuthService);
    const rbac = inject(RbacService);
    return resolveRolesGuard(allowed, router, auth, rbac);
  };
