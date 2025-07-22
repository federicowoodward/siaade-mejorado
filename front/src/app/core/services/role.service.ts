import { Injectable, signal } from '@angular/core';

export type RoleName = 'student' | 'teacher' | 'preceptor' | 'secretary';

@Injectable({ providedIn: 'root' })
export class RolesService {
  readonly currentRole = signal<RoleName>('student');
  readonly isDirective = signal<boolean>(false);

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

  /** Devuelve true si el secretario es directivo (sólo tiene sentido en role secretary) */
  isSecretaryDirective(): boolean {
    return this.currentRole() === 'secretary' && this.isDirective();
  }
}
