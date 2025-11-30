import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class UnAuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    await this.auth.ensureSessionLoaded();
    const isResetPasswordRoute = state.url.startsWith('/auth/reset-password');
    if (this.auth.isLoggedIn() && !isResetPasswordRoute) {
      return this.router.createUrlTree(['/welcome']);
    }
    return true;
  }
}
