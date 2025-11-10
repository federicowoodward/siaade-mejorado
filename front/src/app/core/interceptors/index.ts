import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { AuthInterceptor } from "./auth.interceptor";
import { RefreshInterceptor, REFRESH_ATTEMPTED } from "./refresh.interceptor";
import { ErrorInterceptor } from "./error.interceptor";

export const httpInterceptorProviders = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true,
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: RefreshInterceptor,
    multi: true,
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true,
  },
];

export { AuthInterceptor } from "./auth.interceptor";
export { RefreshInterceptor, REFRESH_ATTEMPTED } from "./refresh.interceptor";
export { ErrorInterceptor } from "./error.interceptor";
