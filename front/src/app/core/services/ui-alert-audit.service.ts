import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ApiService } from './api.service';

export type UiAlertAuditPayload = {
  message: string;
  severity: 'info' | 'warn' | 'error' | 'success';
  timestamp: string;
  frontRoute?: string;
  frontModule?: string;
  action?: string;
  metadata?: Record<string, unknown>;
};

@Injectable({ providedIn: 'root' })
export class UiAlertAuditService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  add(messageService: MessageService, message: any): void {
    // Respetar el tipo de PrimeNG en tiempo de compilación,
    // pero tratar el payload como any para extraer datos.
    (messageService as any).add(message);
    this.logFromToast(message as any);
  }

  private logFromToast(message: any | any[]): void {
    const now = new Date().toISOString();
    const currentRoute = this.router.url;
    const messages: any[] = Array.isArray(message) ? message : [message];

    for (const msg of messages) {
      const severity = (msg.severity as any) ?? 'info';
      if (
        severity !== 'info' &&
        severity !== 'warn' &&
        severity !== 'error' &&
        severity !== 'success'
      ) {
        continue;
      }

      const payload: UiAlertAuditPayload = {
        message: this.buildMessageText(msg),
        severity,
        timestamp: now,
        frontRoute: currentRoute,
        action: (msg.key as string | undefined) ?? undefined,
        metadata: this.buildMetadata(msg),
      };

      this.api
        .request<unknown>('POST', 'audit/alerts', payload)
        .subscribe({ error: () => {} });
    }
  }

  private buildMessageText(msg: { [key: string]: any }): string {
    const parts: string[] = [];
    if (
      typeof msg['summary'] === 'string' &&
      msg['summary'].trim().length
    ) {
      parts.push(msg['summary'].trim());
    }
    if (typeof msg['detail'] === 'string' && msg['detail'].trim().length) {
      parts.push(msg['detail'].trim());
    }
    return parts.join(' - ') || 'Toast sin mensaje';
  }

  private buildMetadata(msg: { [key: string]: any }): Record<string, unknown> {
    const meta: Record<string, unknown> = {};
    if (msg['summary'] != null) meta['summary'] = msg['summary'];
    if (msg['detail'] != null) meta['detail'] = msg['detail'];
    if (msg['data'] != null) meta['data'] = msg['data'];
    if (msg['key'] != null) meta['key'] = msg['key'];
    if (msg['id'] != null) meta['id'] = msg['id'];
    return meta;
  }
}
