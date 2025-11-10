import { Module } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

@Module({
  providers: [HttpExceptionFilter],  // Proveemos el filtro para que pueda ser usado
})
export class FiltersModule {}
