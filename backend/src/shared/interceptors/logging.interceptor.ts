import { Injectable } from '@nestjs/common';
import { ExecutionContext, CallHandler, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();  // Guardamos el tiempo de inicio
    return next
      .handle()
      .pipe(
        tap(() => {
          const responseTime = Date.now() - now;  // Calculamos el tiempo de ejecución
          console.log(`Request processed in ${responseTime}ms`);  // Mostramos el tiempo en la consola
        }),
      );
  }
}
