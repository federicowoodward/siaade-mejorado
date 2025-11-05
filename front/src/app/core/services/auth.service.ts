import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, firstValueFrom, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PermissionService } from "../auth/permission.service";
import {
  ROLE,
  ROLE_BY_ID,
  ROLE_IDS,
  normalizeRole,
} from "../auth/roles";
import { AuthApiService } from "./auth/auth-api.service";
import { AuthStateService } from "./auth/auth-state.service";

type AnyRecord = Record<string, unknown>;

export interface LocalUser {
  id: string;
  username: string | null;
  email: string | null;
  name?: string | null;
  lastName?: string | null;
  role: ROLE | null;
  roleId?: number;
  isExecutive?: boolean;
  [key: string]: unknown;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);

  constructor() {
    this.authState.currentUser$
      .pipe(takeUntilDestroyed())
      .subscribe((user) => {
        if (!user) {
          this.permissions.reset();
          return;
        }

        const resolved = this.resolveRole(user);
        if (resolved.role) {
          this.permissions.setRole(resolved.role, resolved.roleId ?? null);
        } else {
          this.permissions.reset();
        }
      });

    this.authState.refreshFailed$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (!this.router.url.startsWith("/auth")) {
          void this.router.navigate(["/auth"], { replaceUrl: true });
        }
      });
  }

  async login(credentials: { identity: string; password: string }): Promise<boolean> {
    try {
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
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }

  async loginFlexible(credentials: {
    identity?: string; // email / username / CUIL / nombre completo
    username?: string; // retrocompat
    password: string;
  }): Promise<boolean> {
    const identity = credentials.identity ?? credentials.username;
    if (!identity) return false;
    return this.login({ identity, password: credentials.password });
  }

  requestPasswordRecovery(identity: string) {
    return this.authApi.requestPasswordReset(identity);
  }

  confirmPasswordReset(token: string, password: string) {
    return this.authApi.confirmPasswordReset({ token, password });
  }

  verifyResetCode(identity: string, code: string) {
    return this.authApi.verifyResetCode(identity, code);
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.authApi.changePassword({ currentPassword, newPassword });
  }

  async logout(options?: { redirect?: boolean }): Promise<void> {
    await firstValueFrom(
      this.authApi.logout().pipe(
        catchError(() => of(void 0))
      )
    );

    this.authState.clearSession();
    this.permissions.reset();
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
}
