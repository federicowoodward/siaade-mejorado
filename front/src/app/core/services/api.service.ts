// src/app/core/services/api.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment as enviroment } from '../../../environments/environment';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type MaybeWrapped<T> = T | { data: T; error?: any };

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  request<T>(
    method: HttpMethod,
    url: string,
    data?: any,
    params?: Record<string, any>,
    headers?: HttpHeaders
  ): Observable<T> {
    const base = enviroment.apiBaseUrl;
    const fullUrl = `${base}/${url}`;

    let finalHeaders = headers ?? new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = localStorage.getItem('access_token');

    console.log('API Service - Token check:', token ? 'TOKEN EXISTS' : 'NO TOKEN');

    if (token) {
      finalHeaders = finalHeaders.set('Authorization', `Bearer ${token}`);
      console.log('API Service - Added Authorization header');
    } else {
      console.log('API Service - No token, skipping Authorization header');
    }

    const options: { headers: HttpHeaders; params: HttpParams; body?: any } = {
      headers: finalHeaders,
      params: new HttpParams({ fromObject: params ?? {} }),
    };
    if (data !== undefined) options.body = data;

    const req$ = this.http.request<MaybeWrapped<T>>(method, fullUrl, options);

    return req$.pipe(
      tap((resp) => {
        console.groupCollapsed(`[API ✅] ${method} ${fullUrl}`);
        if (data !== undefined) console.log('Body:', data);
        if (params) console.log('Params:', params);
        console.log('Response:', resp);
        console.groupEnd();
      }),
      catchError((err: unknown) => {
        // Log detallado de errores HTTP
        console.groupCollapsed(`[API ❌] ${method} ${fullUrl}`);
        if (data !== undefined) console.log('Body:', data);
        if (params) console.log('Params:', params);

        if (err instanceof HttpErrorResponse) {
          const server = err.error;
          const messages = Array.isArray(server?.message)
            ? server.message
            : (server?.message ? [server.message] : [err.message]);

          console.log('Status:', err.status, err.statusText);
          console.log('URL:', err.url);
          console.log('Server payload:', server);
          console.log('Messages:');
          // Muestra cada mensaje en su propia línea
          messages.forEach((m: any, i: number) => console.log(`  - [${i}]`, m));
        } else {
          console.log('Unknown error object:', err);
        }
        console.groupEnd();

        // Muy importante: propagar el error para que el .subscribe({ error }) lo capture
        return throwError(() => err);
      }),
      map((resp: any) => ('data' in resp ? (resp.data as T) : (resp as T)))
    );
  }

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
