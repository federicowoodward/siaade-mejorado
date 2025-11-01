import { Injectable, inject } from "@angular/core";
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthStateService } from "../services/auth/auth-state.service";

const AUTH_ENDPOINT_REGEX = /\/auth\/(login|refresh|logout)$/i;

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authState = inject(AuthStateService);
  private readonly apiBase = environment.apiBaseUrl.replace(/\/$/, "");

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (!request.url.startsWith(this.apiBase)) {
      return next.handle(request);
    }

    if (this.isAuthEndpoint(request.url)) {
      return next.handle(request);
    }

    const token = this.authState.getAccessTokenSnapshot();
    if (!token) {
      return next.handle(request);
    }

    const authenticatedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next.handle(authenticatedRequest);
  }

  private isAuthEndpoint(url: string): boolean {
    const relative = url.replace(this.apiBase, "");
    return AUTH_ENDPOINT_REGEX.test(relative);
  }
}
