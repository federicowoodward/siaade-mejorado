import { Injectable, signal } from '@angular/core';

interface MailBatchDraft {
  subject: string;
  body: string;
  roles: string[]; // roles destino
  dryRun?: boolean;
}

interface MailBatchStatus {
  id: string;
  subject: string;
  total: number;
  sent: number;
  failed: number;
  status: string;
  createdAt: Date;
}

// Respuesta preview del backend
interface PreviewResponse { preview: true; count: number; }

type CreateResponse = MailBatchStatus | PreviewResponse;

@Injectable({ providedIn: 'root' })
export class BotMailService {
  // Signals simples para el MVP (sin backend todavía)
  sending = signal<boolean>(false);
  batches = signal<MailBatchStatus[]>([]);

  private baseUrl = (window as any).__BOT_BASE_URL__ || 'http://localhost:5001';
  private internalToken = (window as any).__BOT_TOKEN__ || '';

  async createDraft(draft: MailBatchDraft) {
    this.sending.set(true);
    try {
      const resp = await fetch(`${this.baseUrl}/batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-token': this.internalToken
        },
        body: JSON.stringify({
          subject: draft.subject,
            body: draft.body,
            roles: draft.roles,
            dryRun: draft.dryRun
        })
      });
      if (!resp.ok) throw new Error('Error creando batch');
      const data: CreateResponse = await resp.json();
      if ('preview' in data) {
        return { id: 'preview', subject: draft.subject, total: data.count, sent: 0, failed: 0, status: 'preview', createdAt: new Date() } as MailBatchStatus;
      }
      // batch real
      data.createdAt = new Date(data.createdAt);
      this.batches.update(list => [data as MailBatchStatus, ...list]);
      return data as MailBatchStatus;
    } finally {
      this.sending.set(false);
    }
  }

  // Simular avance local (sólo para mock visual)
  simulateProgress(id: string) {
    // Ahora poll real backend
    const poll = () => {
      fetch(`${this.baseUrl}/batches/${id}` , {
        headers: { 'x-internal-token': this.internalToken }
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          data.createdAt = new Date(data.createdAt);
          this.batches.update(list => list.map(b => b.id === id ? { ...b, ...data } : b));
          if (data.status && !['completed','completed_with_errors','canceled'].includes(data.status)) {
            setTimeout(poll, 1500);
          }
        })
        .catch(() => setTimeout(poll, 2000));
    };
    poll();
  }
}
