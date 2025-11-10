import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";

interface LoginPayload {
  identity: string; // email, CUIL o Nombre Apellido
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: Record<string, unknown>;
}

export interface RefreshResponseDto {
  accessToken: string;
}

export interface RequestPasswordResetResponseDto {
  message: string;
  token?: string; // dev only
  expiresInSeconds?: number;
}

export interface VerifyResetCodeResponseDto {
  token: string;
  expiresInSeconds: number;
}

@Injectable({ providedIn: "root" })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  login(credentials: LoginPayload): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(
      `${this.baseUrl}/auth/login`,
      credentials,
      {
        withCredentials: true,
      }
    );
  }

  requestPasswordReset(identity: string): Observable<RequestPasswordResetResponseDto> {
    return this.http.post<RequestPasswordResetResponseDto>(
      `${this.baseUrl}/auth/reset-password`,
      { identity },
      { withCredentials: true }
    );
  }

  confirmPasswordReset(payload: { token: string; password: string; currentPassword?: string }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/auth/reset-password/confirm`,
      payload,
      { withCredentials: true }
    );
  }

  verifyResetCode(identity: string, code: string): Observable<VerifyResetCodeResponseDto> {
    return this.http.post<VerifyResetCodeResponseDto>(
      `${this.baseUrl}/auth/reset-password/verify-code`,
      { identity, code },
      { withCredentials: true }
    );
  }

  refresh(): Observable<RefreshResponseDto> {
    return this.http.post<RefreshResponseDto>(
      `${this.baseUrl}/auth/refresh`,
      {},
      {
        withCredentials: true,
      }
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/auth/logout`,
      {},
      {
        withCredentials: true,
      }
    );
  }
}
