// core/services/role.service.ts
import { Injectable, signal, inject, computed } from '@angular/core';
import { ApiService } from './api.service';

export type RoleName = 'student' | 'teacher' | 'preceptor' | 'secretary';
export interface RoleDto {
  id: number;
  name: RoleName;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private api = inject(ApiService);

  readonly roles = signal<RoleDto[]>([]);
  readonly currentRole = signal<RoleName>('student');
  readonly isDirective = signal<boolean>(false);
  readonly ready = signal<boolean>(false);

  readonly idToName = computed<Record<number, RoleName>>(() =>
    this.roles().reduce((acc, r) => {
      acc[r.id] = r.name;
      return acc;
    }, {} as any)
  );
  readonly nameToId = computed<Record<RoleName, number>>(() =>
    this.roles().reduce((acc, r) => {
      acc[r.name] = r.id;
      return acc;
    }, {} as any)
  );

  /** Llamado desde APP_INITIALIZER */
  async init(): Promise<void> {
    try {
      // GET /api/roles -> { data: RoleDto[], message: string }
      const res = (await this.api.getAll('roles').pipe().toPromise()) as
        | { data?: any[]; message?: string }
        | any[]; // si tu ApiService retorna Observable
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];
      const normalized: RoleDto[] = data.map((r: any) => ({
        id: Number(r.id),
        name: String(r.name).toLowerCase() as RoleName,
      }));
      this.roles.set(normalized);
      this.ready.set(true);
    } catch (e) {
      console.error('[Roles] Error loading roles, using fallback:', e);
      this.roles.set([
        { id: 1, name: 'secretary' },
        { id: 2, name: 'teacher' },
        { id: 3, name: 'preceptor' },
        { id: 4, name: 'student' },
      ]);
      this.ready.set(true);
    }
  }

  setRole(role: RoleName, isDirective = false) {
    this.currentRole.set(role);
    this.isDirective.set(isDirective);
  }
  isRole(role: RoleName) {
    return this.currentRole() === role;
  }
  isOneOf(roles: RoleName[]) {
    return roles.includes(this.currentRole());
  }
  isSecretaryDirective() {
    return this.currentRole() === 'secretary' && this.isDirective();
  }

  getRoleNameById(id: number): RoleName | null {
    return this.idToName()[id] ?? null;
  }
  getRoleIdByName(name: RoleName): number | null {
    return this.nameToId()[name] ?? null;
  }
}
