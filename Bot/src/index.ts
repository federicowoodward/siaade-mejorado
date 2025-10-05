import { program } from 'commander';
import { config } from 'dotenv';
import { logger } from './lib/logger.js';
import { createBatchCommand } from './modules/batch/commands/create-batch.command.js';
import { statusBatchCommand } from './modules/batch/commands/status-batch.command.js';
import { listBatchCommand } from './modules/batch/commands/list-batch.command.js';
import { sendNowCommand } from './modules/batch/commands/send-now.command.js';

config();

program
  .name('siaade-bot')
  .description('Bot CLI para envíos de correo masivo (Mailgun)')
  .version('0.1.0');

program.addCommand(createBatchCommand());
program.addCommand(statusBatchCommand());
program.addCommand(listBatchCommand());
program.addCommand(sendNowCommand());

program.parseAsync().catch((err) => {
  logger.error({ err }, 'Error ejecutando bot');
  process.exit(1);
});
