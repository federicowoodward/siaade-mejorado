import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
  path?: string;
  details?: any;
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const apiError = this.handleError(error, request);

        // En desarrollo, mostrar detalles completos del error
        if (!environment.production) {
          console.groupCollapsed('🚨 [Error Interceptor] HTTP Error Details');
          console.error('Request URL:', request.url);
          console.error('Request Method:', request.method);
          console.error('Error Status:', error.status);
          console.error('Error Message:', error.message);
          console.error('Full Error:', error);
          console.error('Processed API Error:', apiError);
          console.groupEnd();
        }

        return throwError(() => apiError);
      }),
    );
  }

  /**
   * Procesa y normaliza errores HTTP
   */
  private handleError(
    error: HttpErrorResponse,
    request: HttpRequest<any>,
  ): ApiError {
    const timestamp = new Date().toISOString();
    const path = request.url;

    let message = 'Ha ocurrido un error inesperado';
    let details: any = null;

    // Extraer mensaje del error del backend
    if (error.error) {
      if (typeof error.error === 'string') {
        message = error.error;
      } else if (error.error.message) {
        message = error.error.message;
        details = error.error;
      } else if (error.error.error) {
        message = error.error.error;
        details = error.error;
      }
    }

    // Mensajes específicos por código de estado
    switch (error.status) {
      case 0:
        message =
          'No se puede conectar con el servidor. Verifica tu conexión a internet.';
        break;

      case 400:
        message = message || 'Los datos enviados no son válidos.';
        break;

      case 401:
        // Si el backend envió un mensaje específico, lo preservamos; si no, usamos el genérico
        message =
          message || 'No autorizado. Por favor, inicia sesión nuevamente.';
        break;

      case 403:
        message = 'No tienes permisos para realizar esta acción.';
        break;

      case 404:
        message = 'El recurso solicitado no fue encontrado.';
        break;

      case 422:
        message =
          message || 'Los datos enviados contienen errores de validación.';
        break;

      case 429:
        message = 'Demasiadas peticiones. Intenta nuevamente en unos momentos.';
        break;

      case 500:
        message = 'Error interno del servidor. Intenta nuevamente más tarde.';
        break;

      case 502:
        message = 'El servidor no está disponible temporalmente.';
        break;

      case 503:
        message =
          'El servicio no está disponible. Intenta nuevamente más tarde.';
        break;

      case 504:
        message =
          'Tiempo de espera agotado. El servidor tardó demasiado en responder.';
        break;

      default:
        if (error.status >= 500) {
          message = 'Error del servidor. Intenta nuevamente más tarde.';
        } else if (error.status >= 400) {
          message =
            message || 'Error en la solicitud. Verifica los datos enviados.';
        }
    }

    return {
      message,
      status: error.status,
      timestamp,
      path,
      details,
    };
  }
}
