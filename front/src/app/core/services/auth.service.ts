// src/app/core/services/auth.service.ts
import { inject, Injectable } from "@angular/core";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { Router } from "@angular/router";
import { ApiService } from "./api.service";
import {
  PermissionService,
} from "../auth/permission.service";
import {
  ROLE,
  ROLE_BY_ID,
  ROLE_IDS,
  normalizeRole,
} from "../auth/roles";

type AnyRecord = Record<string, any>;

interface LoginResponseShape {
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
  role: ROLE | null;
  roleId?: number;
  isExecutive?: boolean;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly user$ = new BehaviorSubject<LocalUser | null>(null);

  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  private readonly apiService = inject(ApiService);

  constructor() {
    this.loadUserFromStorage();
  }

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

  private extractRole(roleField: unknown): {
    role: ROLE | null;
    roleId: number | null;
  } {
    if (!roleField) {
      return { role: null, roleId: null };
    }

    if (isRolePayload(roleField)) {
      const normalized = normalizeRole(roleField.name);
      const explicitId = Number(roleField.id ?? NaN);
      const roleId = Number.isFinite(explicitId)
        ? explicitId
        : normalized
        ? ROLE_IDS[normalized]
        : null;
      return { role: normalized, roleId };
    }

    if (typeof roleField === "string") {
      const normalized = normalizeRole(roleField);
      return {
        role: normalized,
        roleId: normalized ? ROLE_IDS[normalized] : null,
      };
    }

    return { role: null, roleId: null };
  }

  private buildLocalUser(user: AnyRecord): LocalUser {
    const extracted = this.extractRole(user?.["role"]);
    const roleId = extracted.roleId ?? (user?.["role"]?.id ?? null);

    return {
      id: user?.["id"],
      username: user?.["email"] ?? null,
      email: user?.["email"] ?? null,
      name: user?.["name"] ?? null,
      lastName: user?.["lastName"] ?? null,
      role: extracted.role,
      roleId: roleId ?? undefined,
      isExecutive: extracted.role === ROLE.EXECUTIVE_SECRETARY,
    };
  }

  async loginFlexible(credentials: {
    email?: string;
    username?: string;
    password: string;
  }): Promise<boolean> {
    try {
      const resp = await firstValueFrom(
        this.apiService.request<LoginResponseShape>("POST", "auth/login", {
          email: credentials.email ?? credentials.username,
          password: credentials.password,
        })
      );

      const { userOrProfile, accessToken, refreshToken } =
        this.normalizeBackendPayload(resp ?? {});

      if (!userOrProfile || !accessToken) {
        console.warn("[Auth] Respuesta incompleta del backend:", resp);
        return false;
      }

      const userLocal = this.buildLocalUser(userOrProfile);

      localStorage.setItem("access_token", accessToken);
      if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("mock_user", JSON.stringify(userLocal));

      try {
        localStorage.setItem("user_profile", JSON.stringify(userOrProfile));
      } catch {}

      this.user$.next(userLocal);
      this.permissions.setRole(userLocal.role, userLocal.roleId ?? null);

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }

  logout(): void {
    this.router.navigate(["/auth"]);
    this.user$.next(null);
    this.permissions.reset();
    localStorage.removeItem("mock_user");
    localStorage.removeItem("user_profile");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  isLoggedIn(): boolean {
    return (
      !!localStorage.getItem("mock_user") &&
      !!localStorage.getItem("access_token")
    );
  }

  getUser() {
    return this.user$.asObservable();
  }

  loadUserFromStorage(): void {
    const raw = localStorage.getItem("mock_user");
    if (!raw) return;

    try {
      const parsed: LocalUser = JSON.parse(raw);
      this.user$.next(parsed);

      const roleFromId = parsed.roleId ? ROLE_BY_ID[parsed.roleId] ?? null : null;
      const role = parsed.role ?? roleFromId ?? null;
      this.permissions.setRole(role, parsed.roleId ?? null);
    } catch {
      localStorage.removeItem("mock_user");
    }
  }

  getUserId(): string | null {
    return this.user$.getValue()?.id ?? null;
  }
}

function isRolePayload(value: unknown): value is { id?: number; name?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    ("name" in value || "id" in value)
  );
}
