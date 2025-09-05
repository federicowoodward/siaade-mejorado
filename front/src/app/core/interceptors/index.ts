import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './jwt.interceptor';
import { ErrorInterceptor } from './error.interceptor';

/**
 * Configuración de interceptores HTTP en orden de ejecución
 */
export const httpInterceptorProviders = [
  // 1. JWT Interceptor - Agrega tokens de autenticación
  {
    provide: HTTP_INTERCEPTORS,
    useClass: JwtInterceptor,
    multi: true
  },
  // 2. Error Interceptor - Maneja errores HTTP globalmente
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true
  }
];

// Re-export interceptors for direct use if needed
export { JwtInterceptor } from './jwt.interceptor';
export { ErrorInterceptor } from './error.interceptor';
