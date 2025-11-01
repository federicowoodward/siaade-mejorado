import { Injectable, signal } from "@angular/core";
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  defer,
  firstValueFrom,
  from,
  timer,
} from "rxjs";
import { map } from "rxjs/operators";
import {
  AuthApiService,
  RefreshResponseDto,
} from "./auth-api.service";

type AuthUser = Record<string, unknown>;

const STORAGE_KEY_TOKEN = "siaade.auth.token.v1";
const STORAGE_KEY_USER = "siaade.auth.user.v1";
const STORAGE_SECRET = "siaade-client-v1";
const SILENT_REFRESH_LEEWAY_MS = 60_000;
const PROACTIVE_REFRESH_MARGIN_MS = 90_000;

interface StoredTokenPayload {
  token: string;
  checksum: string;
  exp?: number | null;
}

interface StoredUserPayload {
  value: string;
  checksum: string;
}

@Injectable({ providedIn: "root" })
export class AuthStateService {
  private readonly authApi: AuthApiService;

  private readonly currentUserSignal = signal<AuthUser | null>(null);
  private readonly accessTokenSignal = signal<string | null>(null);

  private readonly currentUserSubject =
    new BehaviorSubject<AuthUser | null>(null);
  private readonly accessTokenSubject =
    new BehaviorSubject<string | null>(null);
  private readonly refreshFailureSubject = new Subject<void>();

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly currentUser$: Observable<AuthUser | null> =
    this.currentUserSubject.asObservable();
  readonly accessToken$: Observable<string | null> =
    this.accessTokenSubject.asObservable();
  readonly refreshFailed$: Observable<void> =
    this.refreshFailureSubject.asObservable();

  private refreshTimerSub: Subscription | null = null;
  private refreshPromise: Promise<string> | null = null;
  private lastKnownExp: number | null = null;

  constructor(authApi: AuthApiService) {
    this.authApi = authApi;
  }

  initializeFromStorage(): void {
    const storedUser = this.readPersistedUser();
    if (storedUser) {
      this.currentUserSignal.set(storedUser);
      this.currentUserSubject.next(storedUser);
    }

    const storedToken = this.readPersistedToken();
    if (storedToken) {
      this.accessTokenSignal.set(storedToken.token);
      this.accessTokenSubject.next(storedToken.token);

      if (storedToken.exp) {
        this.lastKnownExp = storedToken.exp;
        const expiresInMs = storedToken.exp * 1000 - Date.now();
        if (expiresInMs <= PROACTIVE_REFRESH_MARGIN_MS) {
          this.refreshTokens().subscribe({
            error: () => this.handleRefreshFailure(),
          });
        } else {
          this.scheduleSilentRefresh(storedToken.exp);
        }
      }
    }

    this.removeLegacyStorage();
  }

  setCurrentUser(user: AuthUser | null, options?: { persist?: boolean }) {
    this.currentUserSignal.set(user);
    this.currentUserSubject.next(user);

    if (options?.persist) {
      this.persistUser(user);
    }
  }

  getCurrentUserSnapshot(): AuthUser | null {
    return this.currentUserSignal();
  }

  setAccessToken(
    token: string | null,
    options?: { persist?: boolean; schedule?: boolean; exp?: number | null }
  ): void {
    this.accessTokenSignal.set(token);
    this.accessTokenSubject.next(token);

    const exp = token ? options?.exp ?? this.decodeJwtExp(token) : null;
    this.lastKnownExp = exp;

    if (options?.persist) {
      this.persistAccessToken(token, exp);
    }

    if (!token) {
      this.cancelScheduledRefresh();
      return;
    }

    if (options?.schedule === false || !exp) {
      return;
    }

    this.scheduleSilentRefresh(exp);
  }

  getAccessTokenSnapshot(): string | null {
    return this.accessTokenSignal();
  }

  scheduleSilentRefresh(exp: number): void {
    this.cancelScheduledRefresh();
    this.lastKnownExp = exp;

    const targetMs = exp * 1000 - SILENT_REFRESH_LEEWAY_MS;
    const delay = Math.max(targetMs - Date.now(), 0);

    if (delay <= 0) {
      this.refreshTokens().subscribe({
        error: () => this.handleRefreshFailure(),
      });
      return;
    }

    this.refreshTimerSub = timer(delay).subscribe(() => {
      this.refreshTokens().subscribe({
        error: () => this.handleRefreshFailure(),
      });
    });
  }

  clearSession(options?: { emit?: boolean }) {
    this.cancelScheduledRefresh();
    this.lastKnownExp = null;
    this.refreshPromise = null;
    this.setAccessToken(null, { persist: true, schedule: false });
    this.setCurrentUser(null, { persist: true });

    if (options?.emit) {
      this.refreshFailureSubject.next();
    }
  }

  handleRefreshFailure(): void {
    this.clearSession({ emit: true });
  }

  markRefreshFailure(): void {
    this.refreshFailureSubject.next();
  }

  refreshTokens(): Observable<string> {
    return defer(() => {
      if (!this.refreshPromise) {
        this.refreshPromise = firstValueFrom(
          this.authApi.refresh().pipe(
            map((response: RefreshResponseDto) => {
              const accessToken = response.accessToken;
              const exp = this.decodeJwtExp(accessToken);
              this.setAccessToken(accessToken, {
                persist: true,
                schedule: true,
                exp,
              });
              return accessToken;
            })
          )
        )
          .then((token) => {
            this.refreshPromise = null;
            return token;
          })
          .catch((error) => {
            this.refreshPromise = null;
            throw error;
          });
      }

      return from(this.refreshPromise);
    });
  }

  private cancelScheduledRefresh(): void {
    if (this.refreshTimerSub) {
      this.refreshTimerSub.unsubscribe();
      this.refreshTimerSub = null;
    }
  }

  private decodeJwtExp(token: string): number | null {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    try {
      const payload = JSON.parse(this.decodeBase64Url(parts[1]));
      const exp = Number(payload?.exp);
      return Number.isFinite(exp) ? exp : null;
    } catch {
      return null;
    }
  }

  private persistAccessToken(token: string | null, exp: number | null) {
    try {
      if (!token) {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        return;
      }

      const payload: StoredTokenPayload = {
        token: this.encodeValue(token),
        checksum: this.buildChecksum(token),
        exp,
      };

      localStorage.setItem(STORAGE_KEY_TOKEN, JSON.stringify(payload));
    } catch {
      /* ignore persistence errors */
    }
  }

  private persistUser(user: AuthUser | null) {
    try {
      if (!user) {
        localStorage.removeItem(STORAGE_KEY_USER);
        return;
      }

      const serialized = JSON.stringify(user);
      const payload: StoredUserPayload = {
        value: this.encodeValue(serialized),
        checksum: this.buildChecksum(serialized),
      };

      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(payload));
    } catch {
      /* ignore persistence errors */
    }
  }

  private readPersistedToken():
    | { token: string; exp: number | null }
    | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as StoredTokenPayload;
      if (
        typeof parsed?.token !== "string" ||
        typeof parsed?.checksum !== "string"
      ) {
        this.persistAccessToken(null, null);
        return null;
      }

      const decodedToken = this.decodeValue(parsed.token);
      if (this.buildChecksum(decodedToken) !== parsed.checksum) {
        this.persistAccessToken(null, null);
        return null;
      }

      const exp =
        typeof parsed.exp === "number" && Number.isFinite(parsed.exp)
          ? parsed.exp
          : null;

      return { token: decodedToken, exp };
    } catch {
      this.persistAccessToken(null, null);
      return null;
    }
  }

  private readPersistedUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as StoredUserPayload;
      if (
        typeof parsed?.value !== "string" ||
        typeof parsed?.checksum !== "string"
      ) {
        this.persistUser(null);
        return null;
      }

      const decoded = this.decodeValue(parsed.value);
      if (this.buildChecksum(decoded) !== parsed.checksum) {
        this.persistUser(null);
        return null;
      }

      return JSON.parse(decoded) as AuthUser;
    } catch {
      this.persistUser(null);
      return null;
    }
  }

  private removeLegacyStorage() {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("mock_user");
      localStorage.removeItem("user_profile");
    } catch {
      /* ignore removal failures */
    }
  }

  private encodeValue(value: string): string {
    try {
      return btoa(value);
    } catch {
      return value;
    }
  }

  private decodeValue(value: string): string {
    try {
      return atob(value);
    } catch {
      return value;
    }
  }

  private decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded =
      normalized + "===".slice((normalized.length + 3) % 4);
    return this.decodeValue(padded);
  }

  private buildChecksum(value: string): string {
    return this.encodeValue(`${value}|${STORAGE_SECRET}`);
  }
}
