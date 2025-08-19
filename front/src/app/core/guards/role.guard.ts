import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private router: Router,
    // private userSession: UserSessionService // <- Descomenta cuando uses session real
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    // 👇 Acá deberías comparar el rol del usuario logueado contra el requerido.
    // Ejemplo:
    // const requiredRoles = next.data['role'] as string[] | string;
    // const userRole = this.userSession.getRole();
    // if (Array.isArray(requiredRoles) ? requiredRoles.includes(userRole) : requiredRoles === userRole) {
    //   return true;
    // }
    // else {
    //   return this.router.createUrlTree(['/auth']);
    // }

    // Por ahora permite navegar siempre
    return true;
  }
}
