import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface AppConfigSchema {
  apiBaseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config?: AppConfigSchema;
  constructor(private http: HttpClient) {}

  load(): Promise<void> {
    return this.http.get<AppConfigSchema>('assets/app-config.json').toPromise().then(cfg => {
      this.config = cfg;
    }).catch(() => {
      // fallback a build-time env si falla
      this.config = { apiBaseUrl: (window as any).__FALLBACK_API__ || '' };
    }).then(() => void 0);
  }

  get apiBaseUrl(): string {
    if (!this.config) throw new Error('AppConfig not loaded');
    return this.config.apiBaseUrl.replace(/\/$/, '');
  }
}