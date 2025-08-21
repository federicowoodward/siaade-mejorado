import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import MyPreset from './mypreset';
import { httpInterceptorProviders } from './core/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideAnimations(),
    // Interceptores HTTP organizados
    ...httpInterceptorProviders,
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: false, // con esta variable cambia el mode dark
        },
      },
    }),
  ],
};
