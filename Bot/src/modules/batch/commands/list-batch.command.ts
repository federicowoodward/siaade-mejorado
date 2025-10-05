import { Command } from 'commander';
import { batchService } from '../../batch/batch.service.js';

export function listBatchCommand() {
  return new Command('list')
    .description('Listar últimos batches')
    .action(async () => {
      const list = batchService.list();
      for (const b of list) {
        console.log(`${b.id} | ${b.subject} | total=${b.total} sent=${b.sent} failed=${b.failed} status=${b.status}`);
      }
    });
}
