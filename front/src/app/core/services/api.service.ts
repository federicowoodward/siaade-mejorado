import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of, defer, from } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment as enviroment } from '../../../environments/environment';
import { ApiCacheService } from '../cache/api-cache.service';
import { buildCacheKey, logCacheHit } from '../cache/cache-utils';
import { AuthStateService } from './auth/auth-state.service';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type MaybeWrapped<T> = T | { data: T; error?: any };

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private http: HttpClient,
    private cache: ApiCacheService,
    private authState: AuthStateService
  ) {}
  private readonly LOG = (enviroment as any).debugApi === true;

  request<T>(
    method: HttpMethod,
    url: string,
    data?: any,
    params?: Record<string, any>,
    headers?: HttpHeaders
  ): Observable<T> {
    const base = enviroment.apiBaseUrl;
    const fullUrl = `${base}/${url}`;

    const token = this.authState.getAccessTokenSnapshot();
    const finalHeaders =
      headers ?? new HttpHeaders({ 'Content-Type': 'application/json' });

    const options: { headers: HttpHeaders; params: HttpParams; body?: any } = {
      headers: finalHeaders,
      params: new HttpParams({ fromObject: params ?? {} }),
    };
    if (data !== undefined) options.body = data;

    // --- CACHE para GET ---
    // NOTE: Cache temporarily disabled for troubleshooting.
    /*
    if (method === 'GET') {
      const cacheKey = buildCacheKey(method, fullUrl, params ?? {}, token);

      return defer(() =>
        from(this.cache.getIfFresh<T>(cacheKey)).pipe(
          switchMap((cached) => {
            if (cached !== null) {
              // HIT: mostramos log de cache y devolvemos datos; NO corremos el log normal de request
              logCacheHit(method, fullUrl);
              return of(cached);
            }

            // MISS o expirado: hacemos request normal y guardamos en cache
            const req$ = this.http.request<MaybeWrapped<T>>(
              method,
              fullUrl,
              options
            );
            return req$.pipe(
              tap((resp) => {
                console.groupCollapsed(`[API ✅] ${method} ${fullUrl}`);
                if (data !== undefined) console.log('Body:', data);
                if (params) console.log('Params:', params);
                console.log('Response:', resp);
                console.groupEnd();
              }),
              catchError((err: unknown) => {
                console.groupCollapsed(`[API ❌] ${method} ${fullUrl}`);
                if (data !== undefined) console.log('Body:', data);
                if (params) console.log('Params:', params);

                if (err instanceof HttpErrorResponse) {
                  const server = err.error;
                  const messages = Array.isArray(server?.message)
                    ? server.message
                    : server?.message
                    ? [server.message]
                    : [err.message];

                  console.log('Status:', err.status, err.statusText);
                  console.log('URL:', err.url);
                  console.log('Server payload:', server);
                  console.log('Messages:');
                  messages.forEach((m: any, i: number) =>
                    console.log(`  - [${i}]`, m)
                  );
                } else {
                  console.log('Unknown error object:', err);
                }
                console.groupEnd();

                return throwError(() => err);
              }),
              map((resp: any) =>
                'data' in resp ? (resp.data as T) : (resp as T)
              ),
              tap(async (payload) => {
                // Guardado atómico: data + ts en la misma transacción
                await this.cache.set<T>(cacheKey, payload);
              })
            );
          })
        )
      );
    }
    */

    // --- Mutaciones: request normal + invalidación por prefijo ---
    const req$ = this.http.request<MaybeWrapped<T>>(method, fullUrl, options);

    return req$.pipe(
      tap((resp) => {
        if (this.LOG) {
          console.groupCollapsed(`[API ✅] ${method} ${fullUrl}`);
          if (data !== undefined) console.log('Body:', data);
          if (params) console.log('Params:', params);
          console.log('Response:', resp);
          console.groupEnd();
        }
      }),
      catchError((err: unknown) => {
        if (this.LOG) {
          console.groupCollapsed(`[API ❌] ${method} ${fullUrl}`);
          if (data !== undefined) console.log('Body:', data);
          if (params) console.log('Params:', params);

          if (err instanceof HttpErrorResponse) {
            const server = err.error;
            const messages = Array.isArray(server?.message)
              ? server.message
              : server?.message
              ? [server.message]
              : [err.message];

            console.log('Status:', err.status, err.statusText);
            console.log('URL:', err.url);
            console.log('Server payload:', server);
            console.log('Messages:');
            messages.forEach((m: any, i: number) => console.log(`  - [${i}]`, m));
          } else {
            console.log('Unknown error object:', err);
          }
          console.groupEnd();
        }

        return throwError(() => err);
      }),
      map((resp: any) => ('data' in resp ? (resp.data as T) : (resp as T))),
      tap(async () => {
        let relative = fullUrl;
        const base = enviroment.apiBaseUrl.replace(/\/$/, '');
        if (relative.startsWith(base + '/')) {
          relative = relative.substring((base + '/').length);
        } else {
          try {
            const u = new URL(fullUrl);
            relative = u.pathname.replace(/^\/+/, '');
            if (relative.startsWith('api/')) relative = relative.substring(4);
          } catch {}
        }
        const topSegment = relative.split('?')[0].split('/')[0] || '';
        if (topSegment) {
          const baseUrl = `${base}/${topSegment}`;
          const prefix = `GET:${baseUrl}`;
          await this.cache.invalidateByPrefix(prefix);
          if (this.LOG) {
            console.groupCollapsed(`[CACHE ♻️] Invalidado prefijo "${prefix}"`);
            console.groupEnd();
          }
        }
      })
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
  update<T = any>(table: string, id: string | number, data: any) {
    return this.request<T>('PUT', `${table}/${id}`, data);
  }
  delete<T = any>(table: string, id: string | number) {
    return this.request<T>('DELETE', `${table}/${id}`);
  }
}
