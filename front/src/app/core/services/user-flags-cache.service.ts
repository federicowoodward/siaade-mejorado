import { Injectable } from "@angular/core";
import { ROLE } from "../auth/roles";

export type UserFlagsCacheEntry = {
  role: ROLE | null; // rol del usuario destino
  isStudent: boolean;
  isActive: boolean | null;
  canLogin: boolean | null;
  updatedAt: number;
};

const STORAGE_KEY = "userFlagsCache:v1";

@Injectable({ providedIn: "root" })
export class UserFlagsCacheService {
  private mem = new Map<string, UserFlagsCacheEntry>();
  private loadedFromStorage = false;

  private loadFromStorageOnce() {
    if (this.loadedFromStorage) return;
    this.loadedFromStorage = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, UserFlagsCacheEntry>;
      for (const [k, v] of Object.entries(parsed)) {
        if (v && typeof v === "object") {
          this.mem.set(k, v);
        }
      }
    } catch {
      // ignore
    }
  }

  private persist() {
    try {
      const obj: Record<string, UserFlagsCacheEntry> = {};
      for (const [k, v] of this.mem.entries()) obj[k] = v;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch {
      // ignore
    }
  }

  get(userId: string): UserFlagsCacheEntry | null {
    this.loadFromStorageOnce();
    return this.mem.get(userId) ?? null;
  }

  set(userId: string, entry: UserFlagsCacheEntry): void {
    this.mem.set(userId, { ...entry, updatedAt: entry.updatedAt ?? Date.now() });
    this.persist();
  }

  update(userId: string, patch: Partial<UserFlagsCacheEntry>): void {
    const prev = this.get(userId) ?? {
      role: null,
      isStudent: false,
      isActive: null,
      canLogin: null,
      updatedAt: 0,
    };
    this.set(userId, { ...prev, ...patch, updatedAt: Date.now() });
  }

  invalidate(userId: string): void {
    this.mem.delete(userId);
    this.persist();
  }
}
