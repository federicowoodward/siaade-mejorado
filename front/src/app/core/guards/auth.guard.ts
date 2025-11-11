import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  async canActivate():
    Promise<boolean | UrlTree> {
    await this.auth.ensureSessionLoaded();
    if (this.auth.isLoggedIn()) {
      return true;
    }
    return this.router.createUrlTree(['/auth']);
  }
}
