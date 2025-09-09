// src/app/core/services/auth.service.ts
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { RolesService, RoleName } from './role.service';

type AnyRecord = Record<string, any>;

interface LoginResponseShape {
  // Backend puede mandar user o profile; tokens al mismo nivel
  user?: AnyRecord;
  profile?: AnyRecord;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  data?: {
    user?: AnyRecord;
    profile?: AnyRecord;
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
  };
}

interface LocalUser {
  id: string;
  username: string | null;
  email: string | null;
  name?: string | null;
  lastName?: string | null;
  roleName: RoleName | null; // 'student' | 'teacher' | 'preceptor' | 'secretary'
  roleId?: number; // si podemos resolverlo
  isDirective?: boolean; // solo secretary
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user$ = new BehaviorSubject<LocalUser | null>(null);

  private router = inject(Router);
  private rolesService = inject(RolesService);
  private apiService = inject(ApiService);

  constructor() {
    this.loadUserFromStorage();
  }

  // --- Helpers internos ------------------------------------------------------

  private normalizeBackendPayload(resp: LoginResponseShape): {
    userOrProfile: AnyRecord | null;
    accessToken: string | null;
    refreshToken: string | null;
  } {
    const base = (resp?.data ?? resp) as LoginResponseShape;

    const userOrProfile =
      base.profile ??
      base.user ??
      base.data?.profile ??
      base.data?.user ??
      null;

    const accessToken = base.accessToken ?? base.data?.accessToken ?? null;

    const refreshToken = base.refreshToken ?? base.data?.refreshToken ?? null;

    return { userOrProfile, accessToken, refreshToken };
  }

  private extractRoleName(roleField: any): RoleName | null {
    // role puede venir como string ("student") o como objeto { id, name }
    const rname = typeof roleField === 'string' ? roleField : roleField?.name;

    return rname ? (String(rname).toLowerCase() as RoleName) : null;
  }

  private buildLocalUser(
    user: AnyRecord,
    roleIdFromName: number | null
  ): LocalUser {
    const roleName = this.extractRoleName(user?.['role']);
    const local: LocalUser = {
      id: user?.['id'],
      username: user?.['email'] ?? null,
      email: user?.['email'] ?? null,
      name: user?.['name'] ?? null,
      lastName: user?.['lastName'] ?? null,
      roleName,
      roleId: roleIdFromName ?? undefined,
      // si viene desde back (secretary)
      isDirective: Boolean(user?.['isDirective']),
    };
    return local;
  }

  // --- API pública -----------------------------------------------------------

  async loginFlexible(credentials: {
    email?: string;
    username?: string;
    password: string;
  }): Promise<boolean> {
    try {
      if (!this.rolesService.ready()) {
        await this.rolesService.init();
      }

      const resp = await firstValueFrom(
        this.apiService.request<LoginResponseShape>('POST', 'auth/login', {
          email: credentials.email ?? credentials.username,
          password: credentials.password,
        })
      );

      const { userOrProfile, accessToken, refreshToken } =
        this.normalizeBackendPayload(resp ?? {});

      // Si el back no envió nada útil…
      if (!userOrProfile || !accessToken) {
        console.warn('[Auth] Respuesta incompleta del backend:', resp);
        return false;
      }

      // roleName → roleId (si podemos mapear)
      const roleName = this.extractRoleName(userOrProfile['role']);
      const roleIdFromName = roleName
        ? this.rolesService.getRoleIdByName(roleName)
        : null;

      // Usuario local (misma forma que ya guardabas + flags opcionales)
      const userLocal = this.buildLocalUser(userOrProfile, roleIdFromName);

      // 💾 Persistir tokens y usuario (mismo storage que usabas)
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('mock_user', JSON.stringify(userLocal));

      // 💾 (Nuevo opcional) Guardar perfil completo por si lo necesitás en UI
      //   Omitir si preferís no almacenar datos sensibles del perfil.
      try {
        localStorage.setItem('user_profile', JSON.stringify(userOrProfile));
      } catch {}

      // Estado global
      this.user$.next(userLocal);

      // Setear rol en el servicio de roles
      if (roleName) {
        this.rolesService.setRole(roleName, !!userLocal.isDirective);
      } else {
        console.warn(
          '[Auth] roleName ausente en respuesta. Usuario:',
          userOrProfile
        );
      }

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
    localStorage.removeItem('user_profile'); // opcional, por si lo guardamos
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

    try {
      const parsed: LocalUser = JSON.parse(raw);
      this.user$.next(parsed);

      const roleName: RoleName | null =
        parsed.roleName ??
        this.rolesService.getRoleNameById(Number(parsed.roleId));

      if (roleName) {
        this.rolesService.setRole(roleName, !!parsed.isDirective);
      }
    } catch {
      // si está corrupto, limpiar para evitar efectos colaterales
      localStorage.removeItem('mock_user');
    }
  }
}
