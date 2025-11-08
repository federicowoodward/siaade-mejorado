import { Injectable, computed, signal } from '@angular/core';
import { ROLE, RoleLike, isRole } from './roles';

function normalizeInput(value: RoleLike): ROLE | null {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return isRole(normalized) ? (normalized as ROLE) : null;
  }
  return isRole(value) ? value : null;
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly rolesSignal = signal<ROLE[]>([]);
  readonly roles = computed(() => this.rolesSignal());

  setRoles(roles: RoleLike[]): void {
    const normalized = Array.from(
      new Set(
        roles
          .map((role) => normalizeInput(role))
          .filter((role): role is ROLE => !!role)
      )
    );

    this.rolesSignal.set(normalized);
  }

  has(role: RoleLike): boolean {
    const normalized = normalizeInput(role);
    if (!normalized) return false;
    return this.rolesSignal().includes(normalized);
  }

  hasAny(roles: RoleLike[]): boolean {
    if (!roles.length) return true;
    return roles.some((role) => this.has(role));
  }

  hasAll(roles: RoleLike[]): boolean {
    if (!roles.length) return true;
    return roles.every((role) => this.has(role));
  }
}
