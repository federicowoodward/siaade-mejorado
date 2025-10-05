import { logger } from '../../lib/logger.js';
import { batchStore } from './batch.store.js';
import { BatchRecord, BatchStatus, CreateBatchInput } from './batch.types.js';
import { resolveCriteriaEmails } from '../integrations/criteria-resolver.js';
import { sendMailGun } from '../integrations/mailgun-sender.js';

export class BatchService {
  async create(input: CreateBatchInput): Promise<{ batch?: BatchRecord; preview?: boolean; count?: number; }> {
    if (!input.subject) throw new Error('subject requerido');
    if (!input.body && !input.template) throw new Error('body o template requerido');
    const emails = await resolveCriteriaEmails(input.criteria);
    if (input.dryRun) {
      return { preview: true, count: emails.length };
    }
    const batch = batchStore.create(input.subject, input.body || '', emails);
    logger.info({ batchId: batch.id, total: batch.total }, 'Batch creado');
    return { batch };
  }

  list(): BatchRecord[] { return batchStore.list(); }
  get(id: string, full = false): BatchStatus | undefined { return batchStore.get(id, full); }

  async process(batchId: string, rate = 20) {
    const batch = batchStore.get(batchId);
    if (!batch) throw new Error('batch no existe');
    if (batch.status !== 'pending') return;
    batchStore.update(batchId, { status: 'processing', startedAt: new Date() });

    let processed = 0;
    const iterator = batchStore.iteratePending(batchId);

    const tick = async () => {
      const slice: string[] = [];
      for (let i = 0; i < rate; i++) {
        const next = iterator.next();
        if (next.done) break;
        slice.push(next.value.email);
      }
      if (slice.length === 0) {
        // terminado
        const final = batchStore.get(batchId)!;
        const finalStatus = final.failed > 0 && final.sent > 0 ? 'completed_with_errors' : (final.failed > 0 ? 'completed_with_errors' : 'completed');
        batchStore.update(batchId, { status: finalStatus, finishedAt: new Date() });
        logger.info({ batchId, status: finalStatus }, 'Batch finalizado');
        return;
      }
      await Promise.all(slice.map(async (email) => {
        try {
          batchStore.markSending(batchId, email);
          await sendMailGun({ to: email, subject: batch.subject, html: batch.body });
          batchStore.markSent(batchId, email);
        } catch (err: any) {
          batchStore.markFailed(batchId, email, err.message || 'error');
        }
      }));
      processed += slice.length;
      logger.debug({ batchId, processed }, 'progreso');
      setTimeout(tick, 1500); // throttle simple
    };

    tick();
  }
}

export const batchService = new BatchService();
