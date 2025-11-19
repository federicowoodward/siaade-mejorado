import { Injectable, computed, signal } from '@angular/core';
import { ROLE, RoleLike, normalizeRole } from '../auth/roles';
import { environment } from '../../../environments/environment';

type Waiter = {
  resolve: (roles: ROLE[]) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
};

@Injectable({ providedIn: 'root' })
export class RbacService {
  private static readonly GLOBAL_KEY = '__siaade_rbac_service__';

  private readonly rolesSignal = signal<ROLE[] | null>(null);
  readonly roles = this.rolesSignal.asReadonly();
  readonly isLoading = computed(() => this.rolesSignal() === null);

  private readonly waiters = new Set<Waiter>();

  constructor() {
    if (!environment.production) {
      const globalRef = globalThis as Record<string, unknown>;
      const existing = globalRef[RbacService.GLOBAL_KEY] as
        | RbacService
        | undefined;
      if (existing) {
        return existing;
      }
      globalRef[RbacService.GLOBAL_KEY] = this;
    }
  }

  markLoading(reason?: string): void {
    if (this.rolesSignal() === null) {
      this.debug('[loading] skip', reason);
      return;
    }
    this.debug('[loading] start', reason);
    this.rolesSignal.set(null);
  }

  setRoles(input: RoleLike[] | RoleLike | null | undefined): void {
    const normalized = this.normalizeInput(input);
    this.rolesSignal.set(normalized);
    this.debug('[setRoles]', normalized);
    this.flushWaiters(normalized);
  }

  reset(): void {
    this.setRoles([]);
  }

  getSnapshot(): ROLE[] | null {
    return this.rolesSignal();
  }

  has(role: RoleLike): boolean {
    const normalized = this.normalizeRoleValue(role);
    if (!normalized) return false;
    const current = this.rolesSignal();
    if (current === null) return false;
    return current.includes(normalized);
  }

  hasAny(roles: RoleLike[] | RoleLike): boolean {
    const desired = this.normalizeInput(roles);
    if (!desired.length) return true;
    const current = this.rolesSignal();
    if (current === null) return false;
    return desired.some((role) => current.includes(role));
  }

  hasAll(roles: RoleLike[] | RoleLike): boolean {
    const desired = this.normalizeInput(roles);
    if (!desired.length) return true;
    const current = this.rolesSignal();
    if (current === null) return false;
    return desired.every((role) => current.includes(role));
  }

  async waitUntilReady(timeoutMs = 4000): Promise<ROLE[]> {
    const snapshot = this.rolesSignal();
    if (snapshot !== null) {
      return snapshot;
    }

    return await new Promise<ROLE[]>((resolve, reject) => {
      const waiter: Waiter = {
        resolve: (roles) => {
          cleanup();
          resolve(roles);
        },
        reject: (error) => {
          cleanup();
          reject(error);
        },
        timer: null,
      };

      const cleanup = () => {
        if (waiter.timer) {
          clearTimeout(waiter.timer);
        }
        this.waiters.delete(waiter);
      };

      if (timeoutMs > 0) {
        waiter.timer = setTimeout(() => {
          waiter.reject(new Error(`RBAC wait timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }

      this.waiters.add(waiter);
    });
  }

  private flushWaiters(roles: ROLE[]): void {
    if (!this.waiters.size) return;
    for (const waiter of Array.from(this.waiters)) {
      if (waiter.timer) {
        clearTimeout(waiter.timer);
      }
      waiter.resolve(roles);
      this.waiters.delete(waiter);
    }
  }

  private normalizeInput(
    value: RoleLike[] | RoleLike | null | undefined,
  ): ROLE[] {
    const arr = Array.isArray(value)
      ? value
      : value === null || value === undefined
        ? []
        : [value];
    const normalized = arr
      .map((role) => this.normalizeRoleValue(role))
      .filter((role): role is ROLE => !!role);
    return Array.from(new Set(normalized));
  }

  private normalizeRoleValue(value: RoleLike | null | undefined): ROLE | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string') {
      return normalizeRole(value);
    }
    return normalizeRole(value);
  }

  private debug(message: string, payload?: unknown): void {
    if (!environment.debugRbac) return;
    // eslint-disable-next-line no-console
    console.debug(`[RBAC] ${message}`, payload ?? '');
  }
}
