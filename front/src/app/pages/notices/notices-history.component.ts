import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  Notice,
  NoticesService,
  NoticesAudience,
  PaginatedNoticesResponse,
} from '@/core/services/notices.service';
import { PermissionService } from '@/core/auth/permission.service';
import { ROLE } from '@/core/auth/roles';

@Component({
  selector: 'app-notices-history',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    DividerModule,
    ButtonModule,
    PaginatorModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './notices-history.component.html',
  styleUrl: './notices-history.component.scss',
})
export class NoticesHistoryPage implements OnInit {
  private readonly noticesSrv = inject(NoticesService);
  private readonly permissions = inject(PermissionService);

  private readonly pageSize = 5;

  private readonly _audience = signal<NoticesAudience>('all');
  private readonly _items = signal<Notice[]>([]);
  private readonly _page = signal(1);
  private readonly _total = signal(0);
  private readonly _hasNext = signal(false);
  private readonly _hasPrevious = signal(false);

  readonly audience = this._audience.asReadonly();
  readonly items = this._items.asReadonly();
  readonly page = this._page.asReadonly();
  readonly total = this._total.asReadonly();
  readonly hasNext = this._hasNext.asReadonly();
  readonly hasPrevious = this._hasPrevious.asReadonly();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const role = this.permissions.currentRole();

    // Mapeo de rol -> audience del endpoint de avisos
    // - Estudiante: `student`
    // - Docente: `teacher`
    // - Resto (preceptor/secretario/directivo, etc.): `all`
    const audience: NoticesAudience =
      role === ROLE.STUDENT
        ? 'student'
        : role === ROLE.TEACHER
          ? 'teacher'
          : 'all';

    this._audience.set(audience);
    this.loadPage(1);
  }

  onPageChange(event: { page?: number | null; rows?: number | null }): void {
    const pageIndex = event.page ?? 0; // PrimeNG usa índice base 0
    const requestedPage = pageIndex + 1;
    this.loadPage(requestedPage);
  }

  goToPrevious(): void {
    if (!this.hasPrevious()) return;
    this.loadPage(this.page() - 1);
  }

  goToNext(): void {
    if (!this.hasNext()) return;
    this.loadPage(this.page() + 1);
  }

  private loadPage(page: number): void {
    const clampedPage = Math.max(1, page);

    this.loading.set(true);
    this.error.set(null);

    this.noticesSrv
      .getNoticesPaginated({
        audience: this.audience(),
        page: clampedPage,
        limit: this.pageSize,
      })
      .subscribe({
        next: (resp: PaginatedNoticesResponse) => {
          this.applyPageResponse(resp);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[NoticesHistoryPage] error loading notices', err);
          const msg =
            err?.error?.message ??
            err?.message ??
            'No se pudieron cargar los avisos.';
          this.error.set(Array.isArray(msg) ? msg.join(' | ') : String(msg));
          this._items.set([]);
          this.loading.set(false);
        },
      });
  }

  private applyPageResponse(resp: PaginatedNoticesResponse): void {
    this._items.set(resp.items ?? []);
    this._page.set(resp.page ?? 1);
    this._total.set(resp.total ?? resp.items.length);
    this._hasPrevious.set(resp.hasPrevious);
    this._hasNext.set(resp.hasNext);
  }
}
