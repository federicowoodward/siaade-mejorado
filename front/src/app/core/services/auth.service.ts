import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, firstValueFrom, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PermissionService } from "../auth/permission.service";
import { RoleService } from "../auth/role.service";
import {
  ROLE,
  ROLE_BY_ID,
  ROLE_IDS,
  normalizeRole,
} from "../auth/roles";
import { ApiService } from "./api.service";
import { AuthApiService } from "./auth/auth-api.service";
import { AuthStateService } from "./auth/auth-state.service";

type AnyRecord = Record<string, unknown>;

export interface LocalUser {
  id: string;
  username: string | null;
  email: string | null;
  name?: string | null;
  lastName?: string | null;
  isBlocked?: boolean;
  blockedReason?: string | null;
  role: ROLE | null;
  roleId?: number;
  isExecutive?: boolean;
  [key: string]: unknown;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  private readonly roles = inject(RoleService);
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly api = inject(ApiService);

  constructor() {
    this.authState.currentUser$
      .pipe(takeUntilDestroyed())
      .subscribe((user) => this.applyRolesFromUser(user));

    this.authState.refreshFailed$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (!this.router.url.startsWith("/auth")) {
          void this.router.navigate(["/auth"], { replaceUrl: true });
        }
      });
  }

  async login(credentials: { identity: string; password: string }): Promise<boolean> {
    const response = await firstValueFrom(
      this.authApi.login(credentials)
    );

    if (!response?.accessToken || !response?.user) {
      return false;
    }

    const userLocal = this.buildLocalUser(response.user);
    this.authState.setCurrentUser(userLocal, { persist: true });
    this.authState.setAccessToken(response.accessToken, { persist: true });
    const resolved = this.resolveRole(userLocal);
    if (resolved.role) {
      this.permissions.setRole(resolved.role, resolved.roleId ?? null);
    } else {
      this.permissions.reset();
    }

    return true;
  }

  async loginFlexible(credentials: {
    identity?: string; // email / username / CUIL / nombre completo
    username?: string; // retrocompat
    password: string;
  }): Promise<boolean> {
    const identity = credentials.identity ?? credentials.username;
    if (!identity) return false;
    try {
      return await this.login({ identity, password: credentials.password });
    } catch (error: any) {
      // Relay error upward so UI pueda decidir mensaje específico
      throw error;
    }
  }

  async loginWithReason(credentials: { identity: string; password: string }): Promise<{ ok: boolean; blocked?: boolean; blockedReason?: string | null; inactive?: boolean; message?: string }> {
    try {
      const ok = await this.login(credentials);
      return { ok };
    } catch (error: any) {
      const msg: string = (error?.error?.message || error?.message || '').toLowerCase();
      const raw = error?.error?.message || error?.message || '';
      let blocked = false;
      let inactive = false;
      let blockedReason: string | null = null;
      if (msg.includes('inactivo') || msg.includes('eliminado')) inactive = true;
      if (msg.includes('bloqueado')) {
        blocked = true;
        // Extraer motivo después de ':' si existe
        const colonIdx = raw.indexOf(':');
        if (colonIdx >= 0) {
          blockedReason = raw.slice(colonIdx + 1).trim() || null;
        }
      }
      return { ok: false, blocked, blockedReason, inactive, message: raw };
    }
  }

  requestPasswordRecovery(identity: string) {
    return this.authApi.requestPasswordReset(identity);
  }

  confirmPasswordReset(token: string, password: string, currentPassword?: string) {
    return this.authApi.confirmPasswordReset({ token, password, currentPassword });
  }

  verifyResetCode(identity: string, code: string) {
    return this.authApi.verifyResetCode(identity, code);
  }

  async logout(options?: { redirect?: boolean }): Promise<void> {
    await firstValueFrom(
      this.authApi.logout().pipe(
        catchError(() => of(void 0))
      )
    );

    this.authState.clearSession();
    this.permissions.reset();
    this.roles.setRoles([]);
    if (options?.redirect === false) {
      return;
    }

    if (!this.router.url.startsWith("/auth")) {
      await this.router.navigate(["/auth"], { replaceUrl: true });
    }
  }

  isLoggedIn(): boolean {
    return !!this.authState.getAccessTokenSnapshot();
  }

  getUser(): Observable<LocalUser | null> {
    return this.authState.currentUser$ as Observable<LocalUser | null>;
  }

  loadUserFromStorage(): void {
    this.authState.initializeFromStorage();
  }

  async loadUserRoles(): Promise<ROLE[]> {
    const userId = this.getUserId();
    if (!userId) {
      this.roles.setRoles([]);
      this.permissions.reset();
      return [];
    }

    try {
      const profile = await firstValueFrom(this.api.getById<any>("users", userId));
      const resolved = this.resolveRole(profile);
      this.applyResolvedRole(resolved);
      return resolved.role ? [resolved.role] : [];
    } catch (error) {
      console.error("[AuthService] No se pudieron cargar los roles del usuario", error);
      this.roles.setRoles([]);
      return [];
    }
  }

  getUserId(): string | null {
    const snapshot = this.authState.getCurrentUserSnapshot() as
      | LocalUser
      | null;
    return snapshot?.id ?? null;
  }

  private buildLocalUser(user: AnyRecord): LocalUser {
    const extracted = this.resolveRole(user);

    return {
      id: String(user?.["id"] ?? ""),
      username: (user?.["email"] as string) ?? null,
      email: (user?.["email"] as string) ?? null,
      name: (user?.["name"] as string) ?? null,
      lastName: (user?.["lastName"] as string) ?? null,
      isBlocked: Boolean(user?.["isBlocked"] ?? false),
      blockedReason: (user?.["blockedReason"] as string) ?? null,
      role: extracted.role,
      roleId: extracted.roleId ?? undefined,
      isExecutive: extracted.role === ROLE.EXECUTIVE_SECRETARY,
    };
  }

  private resolveRole(
    userOrRole: AnyRecord | ROLE | null
  ): { role: ROLE | null; roleId: number | null } {
    if (!userOrRole) {
      return { role: null, roleId: null };
    }

    if (typeof userOrRole === "string") {
      const normalized = normalizeRole(userOrRole);
      return {
        role: normalized,
        roleId: normalized ? ROLE_IDS[normalized] ?? null : null,
      };
    }

    if (typeof userOrRole === "object") {
      const candidateUser = userOrRole as AnyRecord;
      const rawRole = candidateUser["role"] as unknown;

      if (
        rawRole &&
        typeof rawRole === "object" &&
        rawRole !== null
      ) {
        const candidate = rawRole as { name?: unknown; id?: unknown };
        const normalized = normalizeRole(candidate.name);
        const explicitId = Number(candidate.id ?? NaN);
        return {
          role: normalized,
          roleId: Number.isFinite(explicitId)
            ? explicitId
            : normalized
            ? ROLE_IDS[normalized]
            : null,
        };
      }

      const normalized = normalizeRole(rawRole);
      const fallbackRole =
        normalized ??
        ROLE_BY_ID[Number(candidateUser["roleId"] ?? NaN)] ??
        null;

      return {
        role: fallbackRole,
        roleId: fallbackRole ? ROLE_IDS[fallbackRole] : null,
      };
    }

    return { role: null, roleId: null };
  }

  private applyRolesFromUser(user: AnyRecord | null): void {
    if (!user) {
      this.permissions.reset();
      this.roles.setRoles([]);
      return;
    }

    const resolved = this.resolveRole(user);
    this.applyResolvedRole(resolved);
  }

  private applyResolvedRole(resolved: { role: ROLE | null; roleId: number | null }): void {
    if (resolved.role) {
      this.permissions.setRole(resolved.role, resolved.roleId ?? null);
      this.roles.setRoles([resolved.role]);
    } else {
      this.permissions.reset();
      this.roles.setRoles([]);
    }
  }
}
