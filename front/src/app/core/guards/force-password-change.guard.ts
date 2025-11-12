import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const forcePasswordChangeGuard: CanActivateFn = (
  route,
  state,
): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si no está logueado, no aplica este guard
  if (!auth.isLoggedIn()) return true;

  const needsChange = auth.needsPasswordChange();
  if (!needsChange) return true;

  // Permitir navegar a welcome y a las rutas de cuenta para cambiar contraseña
  const url = state.url || '';
  if (url.startsWith('/welcome') || url.startsWith('/account/password')) {
    return true;
  }

  // Redirigir a welcome para forzar el modal
  return router.parseUrl('/welcome');
};
