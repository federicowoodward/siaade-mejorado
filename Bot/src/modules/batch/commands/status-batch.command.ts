import { Command } from 'commander';
import { batchService } from '../../batch/batch.service.js';

export function statusBatchCommand() {
  return new Command('status')
    .argument('<id>', 'ID del batch')
    .description('Ver estado de un batch')
    .action(async (id: string) => {
      const st = batchService.get(id, true);
      if (!st) return console.error('No encontrado');
      console.log(JSON.stringify(st, null, 2));
    });
}
