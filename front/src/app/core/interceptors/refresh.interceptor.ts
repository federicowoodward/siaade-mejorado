import { Injectable, inject } from "@angular/core";
import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { AuthStateService } from "../services/auth/auth-state.service";

// Incluir reset-password endpoints para evitar intentos de refresh innecesarios
const AUTH_ENDPOINT_REGEX = /\/auth\/(login|refresh|logout|reset-password(?:\/.*)?)$/i;

export const REFRESH_ATTEMPTED = new HttpContextToken<boolean>(() => false);

@Injectable()
export class RefreshInterceptor implements HttpInterceptor {
  private readonly authState = inject(AuthStateService);
  private readonly apiBase = environment.apiBaseUrl.replace(/\/$/, "");

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error) => {
        if (!this.shouldAttemptRefresh(error, request)) {
          return throwError(() => error);
        }

        return this.authState.refreshTokens().pipe(
          switchMap(() => {
            const retriedRequest = request.clone({
              context: request.context.set(REFRESH_ATTEMPTED, true),
            });
            return next.handle(retriedRequest);
          }),
          catchError((refreshError) => {
            this.authState.clearSession({ emit: true });
            return throwError(() =>
              refreshError instanceof HttpErrorResponse
                ? refreshError
                : error
            );
          })
        );
      })
    );
  }

  private shouldAttemptRefresh(
    error: unknown,
    request: HttpRequest<unknown>
  ): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    if (error.status !== 401) {
      return false;
    }

    if (!request.url.startsWith(this.apiBase)) {
      return false;
    }

    if (this.isAuthEndpoint(request.url)) {
      return false;
    }

    if (request.context.get(REFRESH_ATTEMPTED)) {
      return false;
    }

    return true;
  }

  private isAuthEndpoint(url: string): boolean {
    const relative = url.replace(this.apiBase, "");
    return AUTH_ENDPOINT_REGEX.test(relative);
  }
}
