import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface AppConfigSchema { apiBaseUrl: string; }

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config?: AppConfigSchema;
  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    try {
      const cfg = await this.http.get<AppConfigSchema>('assets/app-config.json', { headers: { 'Cache-Control': 'no-cache' } }).toPromise();
      if (cfg && cfg.apiBaseUrl) {
        this.config = { apiBaseUrl: cfg.apiBaseUrl.trim() };
      }
    } catch {
      // fallback silencioso
      const hardcoded = (window as any).__FALLBACK_API__ || 'https://siaade-backend-production.up.railway.app/api';
      this.config = { apiBaseUrl: hardcoded };
    }
  }

  get apiBaseUrl(): string {
    return (this.config?.apiBaseUrl || 'https://siaade-backend-production.up.railway.app/api').replace(/\/$/, '');
  }
}