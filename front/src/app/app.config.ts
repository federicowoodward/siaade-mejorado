import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import MyPreset from './mypreset';
import { httpInterceptorProviders } from './core/interceptors';
import { RolesService } from './core/services/role.service';
// vamos a precargar los roles antes de iniciar la app
// Precarga de roles antes de iniciar la app
function initRolesFactory() {
  const roles = inject(RolesService);
  return () => roles.init?.() ?? Promise.resolve();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideAnimations(),
    ...httpInterceptorProviders,
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: false, // con esta variable cambia el mode dark
        },
      },
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initRolesFactory,
      multi: true,
    },
  ],
};
