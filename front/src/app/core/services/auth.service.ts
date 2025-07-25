import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { RoleName, RolesService } from './role.service';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user$ = new BehaviorSubject<any | null>(null);
  private router = inject(Router);
  private rolesService = inject(RolesService); // 👈 inyectás el service acá

  constructor(private api: ApiService) {
    this.loadUserFromStorage();
  }

  private readonly roleMap: Record<number, RoleName> = {
    1: 'student',
    2: 'teacher',
    3: 'preceptor',
    4: 'secretary',
  };

  loginFlexible(identity: string, password: string): Observable<boolean> {
    return this.api
      .getWhere(
        'users',
        (u) =>
          (u.email === identity ||
            u.name?.toLowerCase() === identity.toLowerCase() ||
            u.cuil === identity) &&
          u.password === password
      )
      .pipe(
        map((users) => {
          const user = users[0];
          if (user) {
            this.user$.next(user);
            localStorage.setItem('mock_user', JSON.stringify(user));

            // 👇 Establece el rol en el RolesService
            const role: RoleName = this.roleMap[user.roleId];
            const isDirective = !!user.isDirective; // #ASUMIENDO campo en user si aplica
            this.rolesService.setRole(role, isDirective);

            return true;
          }
          return false;
        })
      );
  }

  logout() {
    this.router.navigate(['/auth']);
    this.user$.next(null);
    localStorage.removeItem('mock_user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('mock_user');
  }

  getUser(): Observable<any | null> {
    return this.user$.asObservable();
  }

  loadUserFromStorage() {
    const user = localStorage.getItem('mock_user');
    if (user) {
      const parsed = JSON.parse(user);
      this.user$.next(parsed);

      // 👇 También setea el rol al restaurar sesión
      const role: RoleName = this.roleMap[parsed.roleId];
      const isDirective = !!parsed.isDirective;
      this.rolesService.setRole(role, isDirective);
    }
  }
}
