import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environment/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo aplicar el interceptor a peticiones hacia nuestro backend
    if (!request.url.startsWith(environment.apiBaseUrl)) {
      return next.handle(request);
    }

    console.log(`🔄 [JWT Interceptor] ${request.method} ${request.url}`);

    // Obtener token del localStorage
    const token = localStorage.getItem('access_token');
    
    // Clonar la petición y agregar el token si existe
    let authRequest = request;
    if (token && !this.isPublicEndpoint(request.url)) {
      authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('🔐 [JWT Interceptor] Token added to request');
    } else {
      console.log('🔓 [JWT Interceptor] Public endpoint or no token available');
    }

    return next.handle(authRequest).pipe(
      tap(event => {
        // Log successful responses in development
        if (!environment.production) {
          console.log('✅ [JWT Interceptor] Request successful:', event);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ [JWT Interceptor] Request failed:', error);
        
        // Manejar errores específicos
        if (error.status === 401) {
          console.warn('🚨 [JWT Interceptor] Unauthorized - clearing auth data');
          this.handleUnauthorized();
        }
        
        if (error.status === 403) {
          console.warn('🚫 [JWT Interceptor] Forbidden - insufficient permissions');
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica si el endpoint es público (no requiere autenticación)
   */
  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      '/auth/login',
      '/auth/sign-in',
      '/auth/reset-password',
      '/auth/refresh-token'
    ];

    return publicEndpoints.some(endpoint => 
      url.includes(endpoint)
    );
  }

  /**
   * Maneja errores 401 Unauthorized
   */
  private handleUnauthorized(): void {
    // Limpiar datos de autenticación
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    
    // Redirigir al login si no está ya ahí
    if (!this.router.url.includes('/auth/login')) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
    }
  }
}
