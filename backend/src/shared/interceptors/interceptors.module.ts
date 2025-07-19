import { Module } from '@nestjs/common';
import { LoggingInterceptor } from './logging.interceptor';

@Module({
  providers: [LoggingInterceptor],  // Proveemos el interceptor para que pueda ser usado
})
export class InterceptorsModule {}
