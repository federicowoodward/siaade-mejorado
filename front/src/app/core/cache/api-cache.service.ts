import { Injectable } from '@angular/core';

type CacheRecord<T = any> = {
  key: string;
  data: T;
  ts: number; // epoch ms: se actualiza SOLO cuando se actualiza data
};

const DB_NAME = 'siaade-cache';
const STORE_NAME = 'responses';
const DB_VERSION = 1;
const TTL_MS = 10 * 60 * 1000; // 10 minutos

@Injectable({ providedIn: 'root' })
export class ApiCacheService {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.openDB();
  }

  // --- Public API ---
  async getIfFresh<T = any>(key: string): Promise<T | null> {
    const rec = await this.get<CacheRecord<T>>(key);
    if (!rec) return null;
    const isFresh = Date.now() - rec.ts < TTL_MS;
    return isFresh ? rec.data : null;
  }

  async set<T = any>(key: string, data: T): Promise<void> {
    // IMPORTANTE: ts sólo se actualiza con los datos, en la misma transacción
    const db = await this.dbPromise;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: CacheRecord<T> = { key, data, ts: Date.now() };
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    const db = await this.dbPromise;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return resolve();
        const rec = cursor.value as CacheRecord;
        if (rec.key.startsWith(prefix)) cursor.delete();
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
  }

  // --- Internals ---
  private async get<T = any>(key: string): Promise<T | null> {
    const db = await this.dbPromise;
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  private async openDB(): Promise<IDBDatabase> {
    return await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.dbPromise;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('responses', 'readwrite');
      tx.objectStore('responses').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    console.groupCollapsed('[CACHE ♻️] Todos los registros eliminados');
    console.groupEnd();
  }
}
