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

@Injectable({ providedIn: 'root' })
export class BotMailService {
  // Signals simples para el MVP (sin backend todavía)
  sending = signal<boolean>(false);
  batches = signal<MailBatchStatus[]>([]);

  async createDraft(draft: MailBatchDraft) {
    this.sending.set(true);
    try {
      // Placeholder: simula creación de batch
      await new Promise(r => setTimeout(r, 500));
      const fake: MailBatchStatus = {
        id: Math.random().toString(36).slice(2),
        subject: draft.subject,
        total:  draft.dryRun ? 0 : 120, // simulado
        sent: 0,
        failed: 0,
        status: draft.dryRun ? 'preview' : 'pending',
        createdAt: new Date()
      };
      this.batches.update(list => [fake, ...list]);
      return fake;
    } finally {
      this.sending.set(false);
    }
  }

  // Simular avance local (sólo para mock visual)
  simulateProgress(id: string) {
    const timer = setInterval(() => {
      this.batches.update(list => list.map(b => {
        if (b.id !== id) return b;
        if (b.status === 'completed') return b;
        const sent = Math.min(b.total, b.sent + Math.ceil(Math.random()*10));
        const status = sent >= b.total ? 'completed' : 'processing';
        return { ...b, sent, status };
      }));
      const b = this.batches().find(x => x.id === id);
      if (b && b.status === 'completed') clearInterval(timer);
    }, 700);
  }
}
