import { Command } from 'commander';
import { batchService } from '../../batch/batch.service.js';

export function sendNowCommand() {
  return new Command('send')
    .argument('<id>', 'ID del batch')
    .description('Forzar procesamiento inmediato de un batch pendiente')
    .action(async (id: string) => {
      await batchService.process(id);
      console.log('Procesamiento iniciado');
    });
}
