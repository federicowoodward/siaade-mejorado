// src/config/typeorm-options.provider.ts
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileLoggerService } from '@/shared/loggin/file-logger.service';
import { createTypeOrmConfig } from './typeorm.config';
import { createTypeOrmConfigWithLogger } from './logger.config';

const ENABLE_FILE_LOGGER = process.env.ENABLE_FILE_LOGGER === 'true';

export const TYPEORM_OPTIONS = 'TYPEORM_OPTIONS';

export const typeOrmOptionsProvider: Provider = {
  provide: TYPEORM_OPTIONS,
  inject: [ConfigService, FileLoggerService],
  useFactory: (config: ConfigService, fileLogger: FileLoggerService) =>
    ENABLE_FILE_LOGGER
      ? createTypeOrmConfigWithLogger(config, fileLogger)
      : createTypeOrmConfig(config),
};
