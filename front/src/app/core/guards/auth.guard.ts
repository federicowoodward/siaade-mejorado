import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    // private userSession: UserSessionService // <- Descomenta cuando uses session real
  ) {}

  canActivate():
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    // 👇 Acá deberías chequear si el usuario está logueado.
    // Por ejemplo:
    // if (this.userSession.isLoggedIn()) {
    //   return true;
    // }
    // else {
    //   return this.router.createUrlTree(['/auth']);
    // }

    // Por ahora permite navegar siempre
    return true;
  }
}
