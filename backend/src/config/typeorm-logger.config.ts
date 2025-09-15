import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { FileLoggerService } from '@/shared/loggin/file-logger.service';
import { TypeOrmFileLogger } from '@/shared/loggin/typeorm-file.logger';
import { createTypeOrmConfig } from './typeorm.config';

export function createTypeOrmConfigWithLogger(
  config: ConfigService,
  fileLogger: FileLoggerService,
): TypeOrmModuleOptions {
  const base = createTypeOrmConfig(config);

  return {
    ...base,
    logging: ['query', 'error', 'warn', 'schema', 'migration', 'info', 'log'],
    logger: new TypeOrmFileLogger(fileLogger, {
      enabled: ['query', 'error', 'warn', 'schema', 'migration', 'info', 'log'],
      slowQueryThresholdMs: Number(process.env.SLOW_QUERY_MS ?? 200),
    }),
  };
}
