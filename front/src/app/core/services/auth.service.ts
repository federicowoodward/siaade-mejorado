import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { RoleName, RolesService } from './role.service';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user$ = new BehaviorSubject<any | null>(null);
  private router = inject(Router);
  private rolesService = inject(RolesService); // 👈 inyectás el service acá
  private apiService = inject(ApiService);

  constructor() {
    this.loadUserFromStorage();
  }

  private readonly roleMap: Record<number, RoleName> = {
    1: 'secretary', // Administrador (se maneja con isDirective)
    2: 'student',   // Estudiante
    3: 'teacher',   // Profesor
    4: 'preceptor', // Preceptor
    5: 'secretary', // Secretario
  };

  async loginFlexible(credentials: any): Promise<boolean> {
    try {
      const response = await firstValueFrom(this.apiService.request<any>('POST', 'auth/login', {
        email: credentials.username,
        password: credentials.password
      }));

      if (response && response.accessToken && response.user) {
        // Guardar el token
        localStorage.setItem('access_token', response.accessToken);
        
        // Usar la información real del usuario desde el backend
        const user = {
          id: response.user.id,
          username: response.user.email,
          email: response.user.email,
          name: response.user.name,
          lastName: response.user.lastName,
          roleId: response.user.roleId || 1,
          isDirective: response.user.roleId === 1 // Administrador es directive
        };
        
        this.user$.next(user);
        localStorage.setItem('mock_user', JSON.stringify(user));
        
        // 👇 Setea el rol al hacer login
        const role: RoleName = this.roleMap[user.roleId];
        const isDirective = user.isDirective;
        this.rolesService.setRole(role, isDirective);
        
        return true;
      }
      return false;
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
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('mock_user') && !!localStorage.getItem('access_token');
  }

  getUser(): Observable<any | null> {
    return this.user$.asObservable();
  }

  loadUserFromStorage() {
    const user = localStorage.getItem('mock_user');
    if (user) {
      const parsed = JSON.parse(user);
      this.user$.next(parsed);

      // 👇 También setea el rol al restaurar sesión
      const role: RoleName = this.roleMap[parsed.roleId];
      const isDirective = !!parsed.isDirective;
      this.rolesService.setRole(role, isDirective);
    }
  }
}
