import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class UnAuthGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  async canActivate(): Promise<boolean | UrlTree> {
    await this.auth.ensureSessionLoaded();
    if (this.auth.isLoggedIn()) {
      return this.router.createUrlTree(['/welcome']);
    }
    return true;
  }
}
