import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../../environments/environment";

interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: Record<string, unknown>;
}

export interface RefreshResponseDto {
  accessToken: string;
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
