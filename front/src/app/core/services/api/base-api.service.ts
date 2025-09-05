import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  error?: string;
  timestamp: string;
  path: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

@Injectable({ providedIn: 'root' })
export class BaseApiService {
  protected readonly http = inject(HttpClient);
  protected readonly baseUrl = environment.apiBaseUrl;

  /**
   * Realiza una petición HTTP con manejo automático de tokens y errores
   */
  protected request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    params?: Record<string, any>,
    customHeaders?: Record<string, string>
  ): Observable<T> {
    const url = `${this.baseUrl}/${endpoint}`;
    
    // Headers con token automático
    const headers = this.buildHeaders(customHeaders);
    
    // Parámetros de query
    const httpParams = this.buildParams(params);
    
    // Opciones de la petición
    const options = {
      headers,
      params: httpParams,
      ...(data && { body: data })
    };

    return this.http.request<ApiResponse<T>>(method, url, options).pipe(
      tap(response => this.logRequest(method, url, data, params, response)),
      map((response: any) => this.extractData<T>(response)),
      catchError(error => this.handleError(error, method, endpoint))
    );
  }

  /**
   * Construye headers con token JWT automático
   */
  private buildHeaders(customHeaders?: Record<string, string>): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...customHeaders
    });

    const token = localStorage.getItem('access_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Construye parámetros de query
   */
  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    
    return httpParams;
  }

  /**
   * Extrae datos de la respuesta del backend
   */
  private extractData<T>(response: any): T {
    // El backend puede devolver { data: T } o directamente T
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data;
    }
    return response;
  }

  /**
   * Manejo centralizado de errores HTTP
   */
  private handleError(
    error: HttpErrorResponse,
    method: string,
    endpoint: string
  ): Observable<never> {
    console.group(`❌ [API ERROR] ${method} ${endpoint}`);
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Full error:', error);
    console.groupEnd();

    let errorMessage = 'Ha ocurrido un error inesperado';

    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }
    }

    // Manejo específico por código de estado
    switch (error.status) {
      case 401:
        errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        break;
      case 403:
        errorMessage = 'No tienes permisos para realizar esta acción.';
        break;
      case 404:
        errorMessage = 'El recurso solicitado no fue encontrado.';
        break;
      case 422:
        errorMessage = 'Los datos enviados no son válidos.';
        break;
      case 500:
        errorMessage = 'Error interno del servidor. Intenta nuevamente.';
        break;
    }

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      originalError: error
    }));
  }

  /**
   * Log de peticiones en desarrollo
   */
  private logRequest(
    method: string,
    url: string,
    data?: any,
    params?: any,
    response?: any
  ): void {
    if (!environment.production) {
      console.group(`🌐 [API] ${method} ${url}`);
      if (data) console.log('📤 Body:', data);
      if (params) console.log('📋 Params:', params);
      console.log('📥 Response:', response);
      console.groupEnd();
    }
  }

  // Métodos de conveniencia
  protected get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    return this.request<T>('GET', endpoint, undefined, params);
  }

  protected post<T>(endpoint: string, data: any, params?: Record<string, any>): Observable<T> {
    return this.request<T>('POST', endpoint, data, params);
  }

  protected put<T>(endpoint: string, data: any, params?: Record<string, any>): Observable<T> {
    return this.request<T>('PUT', endpoint, data, params);
  }

  protected patch<T>(endpoint: string, data: any, params?: Record<string, any>): Observable<T> {
    return this.request<T>('PATCH', endpoint, data, params);
  }

  protected delete<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    return this.request<T>('DELETE', endpoint, undefined, params);
  }
}
