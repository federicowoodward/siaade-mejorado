// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { LoggingModule } from '@/shared/loggin/logging.module';
import { typeOrmOptionsProvider, TYPEORM_OPTIONS } from './typeorm-options.provider';

@Module({
  imports: [NestConfigModule.forRoot({ isGlobal: true }), LoggingModule],
  providers: [typeOrmOptionsProvider],
  exports: [NestConfigModule, LoggingModule, typeOrmOptionsProvider],
})
export class ConfigModule {}
