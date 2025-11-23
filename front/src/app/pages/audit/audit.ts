import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ApiService } from '../../core/services/api.service';
import { UiAlertAuditPayload } from '../../core/services/ui-alert-audit.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    PaginatorModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './audit.html',
  styleUrl: './audit.scss',
})
export class Audit {
  private readonly api = inject(ApiService);

  private readonly pageSize = 20;

  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(1);
  total = signal(0);
  pages = computed(() =>
    Math.min(10, Math.max(1, Math.ceil(this.total() / this.pageSize))),
  );

  rows = signal<AuditRow[]>([]);

  constructor() {
    this.loadPage(1);
  }

  onPageChange(event: { page?: number | null; rows?: number | null }): void {
    const pageIndex = event.page ?? 0;
    const requestedPage = pageIndex + 1; // PrimeNG usa index base 0
    this.loadPage(requestedPage);
  }

  private loadPage(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    const clampedPage = Math.max(1, Math.min(page, 10));
    this.page.set(clampedPage);

    this.api
      .request<AuditApiResponse | AuditApiRow[]>('GET', 'audit/alerts', undefined, {
        page: clampedPage,
        limit: this.pageSize,
      })
      .subscribe({
        next: (resp) => {
          const rows = Array.isArray(resp)
            ? (resp as AuditApiRow[])
            : Array.isArray((resp as AuditApiResponse | any)?.data)
              ? ((resp as AuditApiResponse).data as AuditApiRow[])
              : [];

          const mapped = rows.map(mapAuditRowFromApi);
          this.rows.set(mapped);

          const total =
            !Array.isArray(resp) &&
            (resp as AuditApiResponse)?.meta &&
            typeof (resp as AuditApiResponse).meta.total === 'number'
              ? (resp as AuditApiResponse).meta.total
              : mapped.length;

          this.total.set(total);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[AuditPage] error loading alerts', err);
          const msg =
            err?.error?.message ??
            err?.message ??
            'No se pudieron cargar las alertas.';
          this.error.set(
            Array.isArray(msg) ? msg.join(' | ') : String(msg),
          );
          this.rows.set([]);
          this.loading.set(false);
        },
      });
  }
}

export type AuditApiRow = {
  id: number;
  userId: string | null;
  severity: UiAlertAuditPayload['severity'] | string;
  message: string;
  frontRoute: string | null;
  frontModule: string | null;
  action: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string | Date;
};

export type AuditApiResponse = {
  data: AuditApiRow[];
  meta: { total: number; page: number; limit: number; pages: number };
};

export type AuditRow = {
  id: number;
  createdAt: Date;
  createdAtLabel: string;
  severity: UiAlertAuditPayload['severity'] | string;
  severityTag: 'success' | 'info' | 'warn' | 'danger' | 'secondary';
  message: string;
  route: string;
  action: string;
  userId: string | null;
};

function mapAuditRowFromApi(row: AuditApiRow): AuditRow {
  const createdAt =
    row.createdAt instanceof Date
      ? row.createdAt
      : new Date(String(row.createdAt));

  const severity = (row.severity as any) ?? 'info';
  const tag: AuditRow['severityTag'] =
    severity === 'success'
      ? 'success'
      : severity === 'error'
        ? 'danger'
        : severity === 'warn'
          ? 'warn'
          : 'info';

  const formatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    id: row.id,
    createdAt,
    createdAtLabel: isNaN(createdAt.getTime())
      ? String(row.createdAt)
      : formatter.format(createdAt),
    severity,
    severityTag: tag,
    message: row.message,
    route: row.frontRoute ?? '(sin ruta)',
    action: row.action ?? '',
    userId: row.userId ?? null,
  };
}
