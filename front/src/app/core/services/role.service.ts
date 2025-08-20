// #ASUMIENDO CODIGO: src/app/core/services/roles.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';

export type RoleName = 
  | 'student'
  | 'teacher'
  | 'preceptor'
  | 'secretary';  // ya no incluimos 'admin', lo manejamos vía isDirective

@Injectable({ providedIn: 'root' })
export class RolesService {
  private api = inject(ApiService);
  
  readonly currentRole = signal<RoleName>('student');
  readonly isDirective = signal<boolean>(false);
  readonly roles = signal<any[]>([]);

  // #ASUMIENDO NEGOCIO: mapeo numérico → nombre de rol (fallback)
  private readonly roleMapFallback: Record<number, RoleName> = {
    1: 'student',
    2: 'teacher', 
    3: 'preceptor',
    4: 'secretary',
  };

  constructor() {
    // Cargar roles desde el backend
    this.loadRoles();
  }

  private loadRoles() {
    this.api.getAll('roles').subscribe({
      next: (roles) => {
        this.roles.set(roles);
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        // Usar fallback si hay error
      }
    });
  }

  /** Cambia el rol actual y el estado de directivo */
  setRole(role: RoleName, isDirective = false) {
    this.currentRole.set(role);
    this.isDirective.set(isDirective);
  }

  /** Devuelve true si el rol guardado es igual al pedido */
  isRole(role: RoleName): boolean {
    return this.currentRole() === role;
  }

  /** Devuelve true si el rol guardado está en una lista */
  isOneOf(roles: RoleName[]): boolean {
    return roles.includes(this.currentRole());
  }

  /** Devuelve true si el secretario es directivo (sólo tiene sentido para 'secretary') */
  isSecretaryDirective(): boolean {
    return this.currentRole() === 'secretary' && this.isDirective();
  }

  /** Devuelve el nombre de rol a partir del roleId numérico */
  getRoleNameById(id: number): RoleName | null {
    const loadedRoles = this.roles();
    if (loadedRoles.length > 0) {
      const role = loadedRoles.find(r => r.id === id);
      if (role) {
        // Mapear nombres del backend a nuestros tipos
        const nameMap: Record<string, RoleName> = {
          'Alumno': 'student',
          'Docente': 'teacher', 
          'Preceptor': 'preceptor',
          'Secretario': 'secretary',
          'Administrador': 'secretary' // Asumiendo que admin se trata como secretary
        };
        return nameMap[role.name] || 'student';
      }
    }
    // Fallback al mapeo hardcodeado
    return this.roleMapFallback[id] ?? null;
  }
}
