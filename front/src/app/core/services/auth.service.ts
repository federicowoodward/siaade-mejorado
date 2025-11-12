import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PermissionService } from '../auth/permission.service';
import { RbacService } from '../rbac/rbac.service';
import { ROLE, ROLE_BY_ID, ROLE_IDS, normalizeRole } from '../auth/roles';
import { ApiService } from './api.service';
import { AuthStateService } from './auth/auth-state.service';
import {
  NormalizedApiError,
  normalizeApiError,
} from '../http/error-normalizer';

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
  requiresPasswordChange?: boolean;
  [key: string]: unknown;
}

type LoginDto = { identity: string; password: string };
type LoginResponseDto = { accessToken: string; user: AnyRecord };
type PasswordResetResponse = {
  message?: string;
  token?: string | null;
  expiresInSeconds?: number | null;
  code?: string | null;
  devIdentity?: string | null;
};
type VerifyCodeResponse = { token: string; expiresInSeconds?: number | null };

type ApiFailureResult = {
  ok: false;
  kind: NormalizedApiError['kind'];
  status: number | 0;
  message: string;
  code?: string | null;
  reason?: string | null;
};

export type LoginResult =
  | { ok: true; token: string; user?: AnyRecord }
  | ApiFailureResult;

export type PasswordRecoveryResult =
  | {
      ok: true;
      message?: string | null;
      token?: string | null;
      expiresInSeconds?: number | null;
      code?: string | null;
    }
  | ApiFailureResult;

export type VerifyResetCodeResult =
  | {
      ok: true;
      token: string;
      expiresInSeconds?: number | null;
    }
  | ApiFailureResult;

export type PasswordChangeCodeResult =
  | {
      ok: true;
      message?: string | null;
      code?: string | null;
      devIdentity?: string | null;
      expiresInSeconds?: number | null;
    }
  | ApiFailureResult;

export type ConfirmPasswordResetResult = { ok: true } | ApiFailureResult;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  private readonly rbac = inject(RbacService);
  private readonly authState = inject(AuthStateService);
  private readonly api = inject(ApiService);

  private storageBootstrapped = false;
  private sessionLoadPromise: Promise<void> | null = null;

  constructor() {
    this.authState.currentUser$
      .pipe(takeUntilDestroyed())
      .subscribe((user) => this.applyRolesFromUser(user));

    this.authState.refreshFailed$.pipe(takeUntilDestroyed()).subscribe(() => {
      if (!this.router.url.startsWith('/auth')) {
        void this.router.navigate(['/auth'], { replaceUrl: true });
      }
    });
  }

  async login(credentials: LoginDto): Promise<boolean> {
    const response = await firstValueFrom(this.loginRequest(credentials));
    this.applyLoginResponse(response);
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

  loginWithReason(payload: LoginDto): Observable<LoginResult> {
    return this.loginRequest(payload).pipe(
      map((resp) => {
        const { token, user } = this.applyLoginResponse(resp);
        return { ok: true as const, token, user };
      }),
      catchError((err) => of(this.asFailure(err))),
    );
  }

  requestPasswordRecovery(
    identity: string,
  ): Observable<PasswordRecoveryResult> {
    return this.api
      .request<PasswordResetResponse>('POST', 'auth/reset-password', {
        identity,
      })
      .pipe(
        map((resp) => ({
          ok: true as const,
          message: resp?.message ?? null,
          token: resp?.token ?? null,
          expiresInSeconds: resp?.expiresInSeconds ?? null,
          code: resp?.code ?? null,
        })),
        catchError((err) => of(this.asFailure(err))),
      );
  }

  confirmPasswordReset(
    token: string,
    password: string,
    currentPassword?: string,
  ): Observable<ConfirmPasswordResetResult> {
    return this.api
      .request<{ success: boolean }>('POST', 'auth/reset-password/confirm', {
        token,
        password,
        currentPassword,
      })
      .pipe(
        map(() => ({ ok: true as const })),
        catchError((err) => of(this.asFailure(err))),
      );
  }

  verifyResetCode(
    identity: string,
    code: string,
  ): Observable<VerifyResetCodeResult> {
    return this.api
      .request<VerifyCodeResponse>('POST', 'auth/reset-password/verify-code', {
        identity,
        code,
      })
      .pipe(
        map((resp) => ({
          ok: true as const,
          token: resp.token,
          expiresInSeconds: resp?.expiresInSeconds ?? null,
        })),
        catchError((err) => of(this.asFailure(err))),
      );
  }

  async forcePasswordChange(password: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.api.request<{ success: boolean }>(
        'POST',
        'auth/password/force-change',
        { password },
      ),
    );
    if (result?.success) {
      // Actualizar el usuario local para que deje de pedir cambio de contraseña
      const current =
        this.authState.getCurrentUserSnapshot() as LocalUser | null;
      if (current) {
        const updated: LocalUser = {
          ...current,
          requiresPasswordChange: false,
        };
        this.authState.setCurrentUser(updated, { persist: true });
      }
    }
    return !!result?.success;
  }

  requestPasswordChangeCode(): Observable<PasswordChangeCodeResult> {
    const user = this.authState.getCurrentUserSnapshot() as LocalUser | null;
    const email = user?.email || '';
    return this.api
      .request<PasswordResetResponse>(
        'POST',
        'auth/password/request-change-code',
        {},
      )
      .pipe(
        map((resp) => ({
          ok: true as const,
          message: resp?.message ?? null,
          code: resp?.code ?? null,
          devIdentity: resp?.devIdentity ?? null,
          expiresInSeconds: resp?.expiresInSeconds ?? null,
        })),
        catchError((err) => {
          const normalized = normalizeApiError(err);
          if (
            (normalized.status === 404 || normalized.status === 405) &&
            email
          ) {
            return this.requestPasswordRecovery(email).pipe(
              map((fallback) =>
                fallback.ok
                  ? {
                      ok: true as const,
                      message:
                        fallback.message ??
                        'Te enviamos un código a tu correo.',
                      code: fallback.code ?? null,
                      devIdentity: email,
                      expiresInSeconds: fallback.expiresInSeconds ?? null,
                    }
                  : fallback,
              ),
            );
          }
          return of(this.fromNormalized(normalized));
        }),
      );
  }

  changePasswordWithCode(
    code: string,
    currentPassword: string,
    newPassword: string,
  ) {
    return this.api.request<{ success: boolean }>(
      'POST',
      'auth/password/change-with-code',
      {
        code,
        currentPassword,
        newPassword,
      },
    );
  }

  private loginRequest(payload: LoginDto) {
    const response = this.api.request<LoginResponseDto>(
      'POST',
      'auth/login',
      payload,
    );
    return response;
  }

  private applyLoginResponse(response: LoginResponseDto): {
    token: string;
    user: AnyRecord;
  } {
    if (!response?.accessToken || !response?.user) {
      throw new Error('Respuesta de login inválida');
    }

    const userLocal = this.buildLocalUser(response.user);
    this.authState.setCurrentUser(userLocal, { persist: true });
    this.authState.setAccessToken(response.accessToken, { persist: true });
    const resolved = this.resolveRole(userLocal);
    this.applyResolvedRole(resolved);

    return { token: response.accessToken, user: response.user };
  }

  private asFailure(err: unknown): ApiFailureResult {
    console.log('AuthService.asFailure error:', err);
    return this.fromNormalized(normalizeApiError(err));
  }

  private fromNormalized(err: NormalizedApiError): ApiFailureResult {
    return {
      ok: false as const,
      kind: err.kind,
      status: err.status,
      message: err.message,
      code: err.code ?? null,
      reason: err.reason ?? null,
    };
  }

  needsPasswordChange(): boolean {
    const user = this.authState.getCurrentUserSnapshot() as LocalUser | null;
    if (!user) return false;
    // Verificar si el usuario tiene una propiedad que indique que necesita cambiar contraseña
    return (user as any).requiresPasswordChange === true;
  }

  async ensureSessionLoaded(options?: { force?: boolean }): Promise<void> {
    const force = options?.force === true;
    if (!force && this.hasStableSession()) {
      return;
    }

    if (this.sessionLoadPromise) {
      await this.sessionLoadPromise;
      if (!force) {
        return;
      }
    }

    this.sessionLoadPromise = this.bootstrapSession(force);
    try {
      await this.sessionLoadPromise;
    } finally {
      this.sessionLoadPromise = null;
    }
  }

  private async bootstrapSession(force = false): Promise<void> {
    this.initializeFromStorage(force);
    const token = this.authState.getAccessTokenSnapshot();

    if (!token) {
      this.permissions.reset();
      this.rbac.reset();
      return;
    }

    if (!force && this.rbac.getSnapshot() !== null) {
      return;
    }

    await this.loadUserRoles();
  }

  private hasStableSession(): boolean {
    if (!this.storageBootstrapped) {
      return false;
    }
    const token = this.authState.getAccessTokenSnapshot();
    const rolesSnapshot = this.rbac.getSnapshot();
    if (!token) {
      return rolesSnapshot !== null;
    }
    return rolesSnapshot !== null;
  }

  private initializeFromStorage(force = false): void {
    if (this.storageBootstrapped && !force) {
      return;
    }
    this.authState.initializeFromStorage();
    this.storageBootstrapped = true;
  }

  async logout(options?: { redirect?: boolean }): Promise<void> {
    await firstValueFrom(
      this.api
        .request<void>('POST', 'auth/logout', {})
        .pipe(catchError(() => of(void 0))),
    );

    this.authState.clearSession();
    this.permissions.reset();
    this.rbac.reset();
    if (options?.redirect === false) {
      return;
    }

    if (!this.router.url.startsWith('/auth')) {
      await this.router.navigate(['/auth'], { replaceUrl: true });
    }
  }

  isLoggedIn(): boolean {
    return !!this.authState.getAccessTokenSnapshot();
  }

  getUser(): Observable<LocalUser | null> {
    return this.authState.currentUser$ as Observable<LocalUser | null>;
  }

  loadUserFromStorage(): void {
    this.initializeFromStorage();
  }

  async loadUserRoles(): Promise<ROLE[]> {
    const userId = this.getUserId();
    if (!userId) {
      this.permissions.reset();
      this.rbac.reset();
      return [];
    }

    this.rbac.markLoading('loadUserRoles');

    try {
      const profile = await firstValueFrom(
        this.api.getById<any>('users', userId),
      );
      let normalized = this.buildLocalUser(profile);
      // Si el perfil leído no trae el flag de cambio obligatorio, conservar el que ya teníamos
      const current =
        this.authState.getCurrentUserSnapshot() as LocalUser | null;
      const incomingFlag = (normalized as any)?.requiresPasswordChange;
      const existingFlag = (current as any)?.requiresPasswordChange;
      if (incomingFlag === undefined && existingFlag !== undefined) {
        normalized = {
          ...normalized,
          requiresPasswordChange: existingFlag,
        } as LocalUser;
      }
      this.authState.setCurrentUser(normalized as LocalUser, { persist: true });
      const resolved = this.resolveRole(normalized);
      this.applyResolvedRole(resolved);
      return resolved.role ? [resolved.role] : [];
    } catch (error) {
      console.error(
        '[AuthService] No se pudieron cargar los roles del usuario',
        error,
      );
      // No derribar la sesión si falla este fetch: conservar estado previo
      const prev = this.rbac.getSnapshot();
      return Array.isArray(prev) ? (prev as ROLE[]) : [];
    }
  }

  getUserId(): string | null {
    const snapshot =
      this.authState.getCurrentUserSnapshot() as LocalUser | null;
    return snapshot?.id ?? null;
  }

  private buildLocalUser(user: AnyRecord): LocalUser {
    const extracted = this.resolveRole(user);

    return {
      id: String(user?.['id'] ?? ''),
      username: (user?.['email'] as string) ?? null,
      email: (user?.['email'] as string) ?? null,
      name: (user?.['name'] as string) ?? null,
      lastName: (user?.['lastName'] as string) ?? null,
      isBlocked: Boolean(user?.['isBlocked'] ?? false),
      blockedReason: (user?.['blockedReason'] as string) ?? null,
      role: extracted.role,
      roleId: extracted.roleId ?? undefined,
      isExecutive: extracted.role === ROLE.EXECUTIVE_SECRETARY,
      requiresPasswordChange: Boolean(
        user?.['requiresPasswordChange'] ?? false,
      ),
    };
  }

  private resolveRole(userOrRole: AnyRecord | ROLE | null): {
    role: ROLE | null;
    roleId: number | null;
  } {
    if (!userOrRole) {
      return { role: null, roleId: null };
    }

    if (typeof userOrRole === 'string') {
      const normalized = normalizeRole(userOrRole);
      return {
        role: normalized,
        roleId: normalized ? (ROLE_IDS[normalized] ?? null) : null,
      };
    }

    if (typeof userOrRole === 'object') {
      const candidateUser = userOrRole as AnyRecord;
      const rawRole = candidateUser['role'] as unknown;

      if (rawRole && typeof rawRole === 'object' && rawRole !== null) {
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
        ROLE_BY_ID[Number(candidateUser['roleId'] ?? NaN)] ??
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
      this.rbac.reset();
      return;
    }

    const resolved = this.resolveRole(user);
    this.applyResolvedRole(resolved);
  }

  private applyResolvedRole(resolved: {
    role: ROLE | null;
    roleId: number | null;
  }): void {
    if (resolved.role) {
      this.permissions.setRole(resolved.role, resolved.roleId ?? null);
      this.rbac.setRoles([resolved.role]);
    } else {
      this.permissions.reset();
      this.rbac.reset();
    }
  }
}
