import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type ExamTableSyncAction = 'created' | 'updated' | 'deleted';

export interface ExamTableSyncEvent {
  action: ExamTableSyncAction;
  mesaId?: number;
  subjectId?: number;
  payload?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ExamTableSyncService {
  private readonly eventsSubject = new Subject<ExamTableSyncEvent>();
  private readonly storageKey = 'siaade:exam-table-sync';
  private readonly pendingKey = 'siaade:exam-table-pending';
  private readonly win: Window | null =
    typeof window !== 'undefined' ? window : null;
  private readonly channel: BroadcastChannel | null = this.buildChannel();
  private pending = this.readPendingFlag();

  constructor() {
    if (this.win) {
      this.win.addEventListener('storage', this.handleStorageEvent);
    }
  }

  get changes$(): Observable<ExamTableSyncEvent> {
    return this.eventsSubject.asObservable();
  }

  notify(event: ExamTableSyncEvent): void {
    this.pending = true;
    this.persistPendingFlag(true);
    this.forward(event);
    this.postToChannel(event);
    this.broadcastViaStorage(event);
  }

  consumePendingFlag(): boolean {
    const wasPending = this.pending;
    if (wasPending) {
      this.pending = false;
      this.persistPendingFlag(false);
    }
    return wasPending;
  }

  private forward(event: ExamTableSyncEvent): void {
    this.eventsSubject.next({ ...event });
  }

  private postToChannel(event: ExamTableSyncEvent): void {
    try {
      this.channel?.postMessage(event);
    } catch {
      // ignore channel errors (unsupported / closed)
    }
  }

  private broadcastViaStorage(event: ExamTableSyncEvent): void {
    if (!this.win?.localStorage) return;
    try {
      const payload = JSON.stringify({ ...event, ts: Date.now() });
      this.win.localStorage.setItem(this.storageKey, payload);
      // Remove key shortly after to avoid unbounded growth
      this.win.setTimeout(() => {
        try {
          this.win?.localStorage?.removeItem(this.storageKey);
        } catch {
          /* noop */
        }
      }, 0);
    } catch {
      /* noop */
    }
  }

  private handleStorageEvent = (evt: StorageEvent): void => {
    if (!evt.key || evt.key !== this.storageKey || !evt.newValue) {
      return;
    }
    try {
      const event = JSON.parse(evt.newValue) as ExamTableSyncEvent;
      this.pending = true;
      this.persistPendingFlag(true);
      this.forward(event);
    } catch {
      /* noop */
    }
  };

  private buildChannel(): BroadcastChannel | null {
    if (!this.win) {
      return null;
    }
    const ctor =
      ((this.win as any)?.BroadcastChannel as typeof BroadcastChannel | undefined) ??
      (typeof BroadcastChannel !== 'undefined' ? BroadcastChannel : undefined);
    if (!ctor) {
      return null;
    }
    try {
      const channel = new ctor('siaade-exam-table-sync');
      channel.onmessage = (ev: MessageEvent<ExamTableSyncEvent>) => {
        if (!ev?.data) return;
        this.pending = true;
        this.persistPendingFlag(true);
        this.forward(ev.data);
      };
      return channel;
    } catch {
      return null;
    }
  }

  private readPendingFlag(): boolean {
    if (!this.win?.sessionStorage) {
      return false;
    }
    try {
      return this.win.sessionStorage.getItem(this.pendingKey) === '1';
    } catch {
      return false;
    }
  }

  private persistPendingFlag(value: boolean): void {
    if (!this.win?.sessionStorage) return;
    try {
      if (value) {
        this.win.sessionStorage.setItem(this.pendingKey, '1');
      } else {
        this.win.sessionStorage.removeItem(this.pendingKey);
      }
    } catch {
      /* noop */
    }
  }
}
