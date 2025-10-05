import { BatchRecord, BatchStatus, RecipientRecord } from './batch.types.js';
import { randomUUID } from 'crypto';

class InMemoryBatchStore {
  private batches = new Map<string, BatchRecord>();
  private recipients = new Map<string, RecipientRecord[]>();

  create(subject: string, body: string, emails: string[]): BatchRecord {
    const id = randomUUID();
    const batch: BatchRecord = {
      id,
      subject,
      body,
      total: emails.length,
      sent: 0,
      failed: 0,
      status: 'pending',
      createdAt: new Date(),
    };
    this.batches.set(id, batch);
    this.recipients.set(
      id,
      emails.map((e) => ({ email: e, status: 'pending' as const }))
    );
    return batch;
  }

  list(): BatchRecord[] {
    return Array.from(this.batches.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  get(id: string, withRecipients = false): BatchStatus | undefined {
    const b = this.batches.get(id);
    if (!b) return undefined;
    return withRecipients
      ? { ...b, recipients: this.recipients.get(id) }
      : { ...b };
  }

  update(id: string, patch: Partial<BatchRecord>) {
    const current = this.batches.get(id);
    if (!current) return;
    this.batches.set(id, { ...current, ...patch });
  }

  *iteratePending(id: string): Generator<RecipientRecord> {
    const list = this.recipients.get(id) || [];
    for (const r of list) {
      if (r.status === 'pending') yield r;
    }
  }

  markSending(id: string, email: string) {
    const rec = this.recipients.get(id)?.find((r) => r.email === email);
    if (rec) rec.status = 'sending';
  }
  markSent(id: string, email: string) {
    const recs = this.recipients.get(id);
    const rec = recs?.find((r) => r.email === email);
    if (rec) rec.status = 'sent';
    const b = this.batches.get(id);
    if (b) {
      b.sent += 1;
    }
  }
  markFailed(id: string, email: string, error: string) {
    const recs = this.recipients.get(id);
    const rec = recs?.find((r) => r.email === email);
    if (rec) {
      rec.status = 'failed';
      rec.error = error;
    }
    const b = this.batches.get(id);
    if (b) b.failed += 1;
  }
}

export const batchStore = new InMemoryBatchStore();
