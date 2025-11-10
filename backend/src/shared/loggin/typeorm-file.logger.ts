import { Logger as TypeOrmLogger, QueryRunner } from 'typeorm';
import { FileLoggerService } from './file-logger.service';

type TypeOrmLevel = 'log' | 'info' | 'warn';

export interface TypeOrmFileLoggerOptions {
  /**
   * Qué tipos de logging querés que capture (igual que la opción `logging` de TypeORM).
   * Ej: ['query', 'error', 'schema', 'warn', 'info', 'log', 'migration']
   */
  enabled: Array<'query' | 'error' | 'schema' | 'warn' | 'info' | 'log' | 'migration'>;
  slowQueryThresholdMs?: number; // opcional: para marcar slow queries
}

export class TypeOrmFileLogger implements TypeOrmLogger {
  constructor(
    private readonly fileLogger: FileLoggerService,
    private readonly opts: TypeOrmFileLoggerOptions,
  ) {}

  private isOn(flag: TypeOrmFileLoggerOptions['enabled'][number]) {
    return this.opts.enabled.includes(flag);
  }

  logQuery(query: string, parameters?: unknown[], _queryRunner?: QueryRunner) {
    if (!this.isOn('query')) return;
    this.fileLogger.write('QUERY', 'SQL Executed', {
      query,
      parameters: parameters ?? [],
    });
  }

  logQueryError(error: string | Error, query: string, parameters?: unknown[], _qr?: QueryRunner) {
    if (!this.isOn('error')) return;
    this.fileLogger.write('ERROR', 'SQL Error', {
      query,
      parameters: parameters ?? [],
      error: typeof error === 'string' ? error : { name: error.name, message: error.message, stack: error.stack },
    });
  }

  logQuerySlow(time: number, query: string, parameters?: unknown[], _qr?: QueryRunner) {
    // siempre lo registramos como SLOW; si querés, filtrá por umbral
    const threshold = this.opts.slowQueryThresholdMs ?? 200; // por defecto 200ms
    if (time >= threshold) {
      this.fileLogger.write('SLOW', `Slow Query (${time} ms)`, {
        query,
        parameters: parameters ?? [],
        elapsedMs: time,
      });
    }
  }

  logSchemaBuild(message: string, _qr?: QueryRunner) {
    if (!this.isOn('schema')) return;
    this.fileLogger.write('SCHEMA', 'Schema build', { message });
  }

  logMigration(message: string, _qr?: QueryRunner) {
    if (!this.isOn('migration')) return;
    this.fileLogger.write('MIGRATION', 'Migration', { message });
  }

  log(level: TypeOrmLevel, message: unknown, _qr?: QueryRunner) {
    const map = { log: 'LOG', info: 'INFO', warn: 'WARN' } as const;
    const enabled =
      (level === 'log' && this.isOn('log')) ||
      (level === 'info' && this.isOn('info')) ||
      (level === 'warn' && this.isOn('warn'));

    if (!enabled) return;

    this.fileLogger.write(map[level], 'TypeORM', { message });
  }
}
