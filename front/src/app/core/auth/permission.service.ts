import { Injectable, computed, signal } from '@angular/core';
import { ROLE, ROLE_IDS, ROLE_BY_ID, normalizeRole } from './roles';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly roleSignal = signal<ROLE | null>(null);
  private readonly roleIdSignal = signal<number | null>(null);

  readonly role = this.roleSignal.asReadonly();
  readonly roleId = this.roleIdSignal.asReadonly();
  readonly isExecutive = computed(
    () => this.roleSignal() === ROLE.EXECUTIVE_SECRETARY
  );

  currentRole(): ROLE | null {
    return this.roleSignal();
  }

  setRole(role: ROLE | null, roleId?: number | null): void {
    const resolvedRoleId =
      roleId ?? (role ? ROLE_IDS[role] ?? null : null);
    this.roleSignal.set(role);
    this.roleIdSignal.set(resolvedRoleId ?? null);
  }

  setFromPayload(payload: { role?: unknown; roleId?: unknown }): void {
    const normalized = normalizeRole(payload?.role);
    const byId = ROLE_BY_ID[Number(payload?.roleId) || -1] ?? null;
    const role = normalized ?? byId ?? null;
    this.setRole(role, role ? ROLE_IDS[role] : null);
  }

  reset(): void {
    this.roleSignal.set(null);
    this.roleIdSignal.set(null);
  }

  hasRole(role: ROLE): boolean {
    return this.roleSignal() === role;
  }

  hasAnyRole(roles: ROLE[]): boolean {
    if (!roles.length) return true;
    const current = this.roleSignal();
    return !!current && roles.includes(current);
  }
}
