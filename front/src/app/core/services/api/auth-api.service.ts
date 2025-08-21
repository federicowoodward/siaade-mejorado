import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { BaseApiService } from './base-api.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: UserData;
}

export interface UserData {
  id: string;
  name: string;
  lastName: string;
  email: string;
  cuil: string;
  roleId: number;
  role: {
    id: number;
    name: string;
  };
}

export interface ResetPasswordRequest {
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService extends BaseApiService {
  private readonly router = inject(Router);
  private readonly currentUser$ = new BehaviorSubject<UserData | null>(null);

  constructor() {
    super();
    this.loadUserFromStorage();
  }

  /**
   * Observable del usuario actual
   */
  get user$(): Observable<UserData | null> {
    return this.currentUser$.asObservable();
  }

  /**
   * Usuario actual (snapshot)
   */
  get currentUser(): UserData | null {
    return this.currentUser$.value;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  get isAuthenticated(): boolean {
    return !!this.currentUser && !!localStorage.getItem('access_token');
  }

  /**
   * Inicia sesión
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.post<LoginResponse>('auth/login', credentials).pipe(
      tap(response => {
        this.setAuthData(response.access_token, response.user);
      })
    );
  }

  /**
   * Inicia sesión de manera asíncrona (para guards y resolvers)
   */
  async loginAsync(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await firstValueFrom(this.login(credentials));
    return response;
  }

  /**
   * Cierra sesión
   */
  logout(): Observable<any> {
    return this.post('auth/logout', {}).pipe(
      tap(() => {
        this.clearAuthData();
      })
    );
  }

  /**
   * Cierra sesión localmente (sin llamada al backend)
   */
  logoutLocal(): void {
    this.clearAuthData();
  }

  /**
   * Refresca el token
   */
  refreshToken(): Observable<LoginResponse> {
    return this.post<LoginResponse>('auth/refresh-token', {}).pipe(
      tap(response => {
        this.setAuthData(response.access_token, response.user);
      })
    );
  }

  /**
   * Solicita reset de contraseña
   */
  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.post('auth/reset-password', data);
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(roleId: number): boolean {
    return this.currentUser?.roleId === roleId;
  }

  /**
   * Verifica si el usuario tiene uno de los roles especificados
   */
  hasAnyRole(roleIds: number[]): boolean {
    return !!this.currentUser && roleIds.includes(this.currentUser.roleId);
  }

  /**
   * Verifica si el usuario es administrador
   */
  get isAdmin(): boolean {
    return this.hasRole(1); // Rol Administrador
  }

  /**
   * Verifica si el usuario es estudiante
   */
  get isStudent(): boolean {
    return this.hasRole(2); // Rol Estudiante
  }

  /**
   * Verifica si el usuario es profesor
   */
  get isTeacher(): boolean {
    return this.hasRole(3); // Rol Profesor
  }

  /**
   * Verifica si el usuario es preceptor
   */
  get isPreceptor(): boolean {
    return this.hasRole(4); // Rol Preceptor
  }

  /**
   * Verifica si el usuario es secretario
   */
  get isSecretary(): boolean {
    return this.hasRole(5); // Rol Secretario
  }

  /**
   * Almacena datos de autenticación
   */
  private setAuthData(token: string, user: UserData): void {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    this.currentUser$.next(user);
    
    console.log('🔐 User authenticated:', user.name, user.lastName);
  }

  /**
   * Limpia datos de autenticación
   */
  private clearAuthData(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    this.currentUser$.next(null);
    this.router.navigate(['/auth/login']);
    
    console.log('🚪 User logged out');
  }

  /**
   * Carga usuario desde localStorage al inicializar
   */
  private loadUserFromStorage(): void {
    try {
      const userData = localStorage.getItem('user_data');
      const token = localStorage.getItem('access_token');
      
      if (userData && token) {
        const user: UserData = JSON.parse(userData);
        this.currentUser$.next(user);
        console.log('🔄 User loaded from storage:', user.name, user.lastName);
      }
    } catch (error) {
      console.error('❌ Error loading user from storage:', error);
      this.clearAuthData();
    }
  }
}
