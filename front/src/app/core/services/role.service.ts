// #ASUMIENDO CODIGO: src/app/core/services/roles.service.ts
import { Injectable, signal } from '@angular/core';

export type RoleName = 
  | 'student'
  | 'teacher'
  | 'preceptor'
  | 'secretary';  // ya no incluimos 'admin', lo manejamos vía isDirective

@Injectable({ providedIn: 'root' })
export class RolesService {
  readonly currentRole = signal<RoleName>('student');
  readonly isDirective = signal<boolean>(false);

  // #ASUMIENDO NEGOCIO: mapeo numérico → nombre de rol
  private readonly roleMap: Record<number, RoleName> = {
    1: 'student',
    2: 'teacher',
    3: 'preceptor',
    4: 'secretary',
  };

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
    return this.roleMap[id] ?? null;
  }
}
