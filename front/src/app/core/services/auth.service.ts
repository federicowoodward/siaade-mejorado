import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { RoleName, RolesService } from './role.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user$ = new BehaviorSubject<any | null>(null);
  private router = inject(Router);
  private rolesService = inject(RolesService);
  private apiService = inject(ApiService);

  constructor() {
    this.loadUserFromStorage();
  }

  async loginFlexible(credentials: {
    email?: string;
    username?: string;
    password: string;
  }): Promise<boolean> {
    try {
      if (!this.rolesService.ready()) await this.rolesService.init();

      // 🚀 POST /api/auth/login -> { data: { user, accessToken, refreshToken, tokenType }, message }
      const resp = await firstValueFrom(
        this.apiService.request<any>('POST', 'auth/login', {
          email: credentials.email ?? credentials.username, // tu form envía email
          password: credentials.password,
        })
      );

      const data = resp;
      if (!data) {
        console.warn('[Auth] Respuesta sin data:', resp);
        return false;
      }

      const { user, accessToken, refreshToken } = data;
      if (!accessToken || !user) {
        console.warn('[Auth] Falta accessToken o user:', data);
        return false;
      }

      // 🧠 Normalizar roleName desde backend (string) y obtener roleId desde RolesService
      const roleName: RoleName | null = (
        user.role ? String(user.role).toLowerCase() : null
      ) as RoleName | null;

      const roleIdFromName = roleName
        ? this.rolesService.getRoleIdByName(roleName)
        : null;

      // 📝 Construir user local
      const userLocal = {
        id: user.id,
        username: user.email,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        roleName, // 'student' | 'teacher' | 'preceptor' | 'secretary'
        roleId: roleIdFromName ?? undefined, // 1..4 si se pudo resolver
        isDirective: !!user.isDirective, // viene del back si es secretary/directive
      };

      // 💾 Persistir tokens y usuario
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('mock_user', JSON.stringify(userLocal));

      // 📌 Actualizar estado global
      this.user$.next(userLocal);

      if (roleName) {
        this.rolesService.setRole(roleName, userLocal.isDirective);
      } else {
        console.warn('[Auth] roleName ausente en respuesta. Usuario:', user);
      }

      console.log(
        '[Auth] Login OK → roleName:',
        roleName,
        'roleId:',
        roleIdFromName
      );
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  logout() {
    this.router.navigate(['/auth']);
    this.user$.next(null);
    localStorage.removeItem('mock_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isLoggedIn(): boolean {
    return (
      !!localStorage.getItem('mock_user') &&
      !!localStorage.getItem('access_token')
    );
  }

  getUser() {
    return this.user$.asObservable();
  }

  loadUserFromStorage() {
    const raw = localStorage.getItem('mock_user');
    if (!raw) return;

    const parsed = JSON.parse(raw);
    this.user$.next(parsed);

    const roleName: RoleName | null =
      parsed.roleName ??
      this.rolesService.getRoleNameById(Number(parsed.roleId));
    if (roleName) this.rolesService.setRole(roleName, !!parsed.isDirective);
  }
}
