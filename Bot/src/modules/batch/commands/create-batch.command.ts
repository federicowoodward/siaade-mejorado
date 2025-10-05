import { Command } from 'commander';
import { batchService } from '../../batch/batch.service.js';

export function createBatchCommand() {
  const cmd = new Command('create')
    .description('Crear batch a partir de criterios de roles')
    .requiredOption('-s, --subject <subject>', 'Asunto')
    .option('-b, --body <body>', 'Cuerpo HTML', '<p>Mensaje</p>')
    .option('-r, --roles <roles>', 'Roles separados por coma (teacher,student,preceptor,secretary)')
    .option('--dry-run', 'Solo calcular sin crear')
    .action(async (opts) => {
      const roles = opts.roles ? String(opts.roles).split(',').map((r: string) => r.trim()) : undefined;
      const { batch, preview, count } = await batchService.create({
        subject: opts.subject,
        body: opts.body,
        criteria: { roles },
        dryRun: !!opts.dryRun,
      });
      if (preview) {
        console.log(`Preview: se enviarían ${count} correos.`);
      } else if (batch) {
        console.log(`Batch creado: ${batch.id} total=${batch.total}`);
        await batchService.process(batch.id);
      }
    });
  return cmd;
}
