import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Si tu back devuelve { data, error }, lo seguimos soportando.
// Si devuelve el objeto "raw" (p.ej. { deleted: true }), también.
type MaybeWrapped<T> = T | { data: T; error?: any };

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  request<T>(
    method: HttpMethod,
    url: string,
    data?: any,
    params?: Record<string, any>,
    headers?: HttpHeaders
  ): Observable<T> {
    const fullUrl = `${this.baseUrl}/${url}`;

    // Crear headers con token JWT si está disponible
    let finalHeaders = headers ?? new HttpHeaders({ 'Content-Type': 'application/json' });
    
    // Agregar token JWT automáticamente si existe
    const token = localStorage.getItem('access_token');
    console.log('API Service - Token check:', token ? 'TOKEN EXISTS' : 'NO TOKEN');
    
    if (token) {
      finalHeaders = finalHeaders.set('Authorization', `Bearer ${token}`);
      console.log('API Service - Added Authorization header');
    } else {
      console.log('API Service - No token, skipping Authorization header');
    }

    // Armamos las opciones y si hay "data" lo mandamos en "body" SIEMPRE
    const options: {
      headers: HttpHeaders;
      params: HttpParams;
      body?: any;
    } = {
      headers: finalHeaders,
      params: new HttpParams({ fromObject: params ?? {} }),
    };

    if (data !== undefined) {
      options.body = data; // <- esto habilita body en DELETE/GET si lo necesitás
    }

    const req$ = this.http.request<MaybeWrapped<T>>(method, fullUrl, options);

    return req$.pipe(
      tap((resp) => {
        console.groupCollapsed(`[API] ${method} ${fullUrl}`);
        if (data !== undefined) console.log('Body:', data);
        if (params) console.log('Params:', params);
        console.log('Response:', resp);
        console.groupEnd();
      }),
      map((resp: any) => ('data' in resp ? (resp.data as T) : (resp as T)))
    );
  }

  // Métodos de conveniencia para mantener compatibilidad con el frontend existente
  getAll<T = any>(table: string): Observable<T[]> {
    return this.request<T[]>('GET', table);
  }

  getById<T = any>(table: string, id: string | number): Observable<T> {
    return this.request<T>('GET', `${table}/${id}`);
  }

  create<T = any>(table: string, data: any): Observable<T> {
    return this.request<T>('POST', table, data);
  }

  update<T = any>(table: string, id: string | number, data: any): Observable<T> {
    return this.request<T>('PUT', `${table}/${id}`, data);
  }

  delete<T = any>(table: string, id: string | number): Observable<T> {
    return this.request<T>('DELETE', `${table}/${id}`);
  }
}
