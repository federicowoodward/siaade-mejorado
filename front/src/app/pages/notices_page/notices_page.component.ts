import {
  Component,
  inject,
  computed,
  NgZone,
  OnInit,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmationService } from 'primeng/api';
import {
  NoticesService,
  Notice,
  NoticeCommissionTarget,
  NoticesAudience,
  PaginatedNoticesResponse,
} from '../../core/services/notices.service';
import { PermissionService } from '../../core/auth/permission.service';
import { ROLE, VisibleRole } from '../../core/auth/roles';
import { CanAnyRoleDirective } from '../../shared/directives/can-any-role.directive';
import { BlockedActionDirective } from '../../shared/directives/blocked-action.directive';
import { CatalogsService } from '../../core/services/catalogs.service';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-notices-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EditorModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ConfirmPopupModule,
    DialogModule,
    PaginatorModule,
    ProgressSpinnerModule,
    CanAnyRoleDirective,
    BlockedActionDirective,
  ],
  templateUrl: './notices_page.component.html',
  styleUrls: ['./notices_page.component.scss'],
  providers: [ConfirmationService],
})
export class NoticesPageComponent implements OnInit {
  private noticesSrv = inject(NoticesService);
  private permissions = inject(PermissionService);
  private catalogs = inject(CatalogsService);
  private zone = inject(NgZone);
  private confirmationService = inject(ConfirmationService);
  protected readonly ROLE = ROLE;

  private readonly pageSize = 5;

  notices = this.noticesSrv.notices;
  segmentByCommission = this.noticesSrv.segmentByCommission;
  commissionOptions = this.noticesSrv.commissionOptions;

  // Estado de paginación para el listado de avisos
  private readonly audience = signal<NoticesAudience>('all');
  paginatedNotices = signal<Notice[]>([]);
  page = signal(1);
  total = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  // Estado del diálogo de creación
  createDialogVisible = signal(false);

  canManage = computed(() =>
    this.permissions.hasAnyRole([
      ROLE.SECRETARY,
      ROLE.PRECEPTOR,
      ROLE.EXECUTIVE_SECRETARY,
    ]),
  );

  newNotice: Partial<Notice> &
    Pick<Notice, 'visibleFor'> & {
      commissionTargets?: NoticeCommissionTarget[];
    } = {
    title: '',
    content: '',
    visibleFor: ROLE.STUDENT as VisibleRole,
    commissionTargets: [],
  };
  selectedCommissionIds: number[] = [];

  constructor() {
    effect(() => {
      if (this.segmentByCommission()) {
        void this.noticesSrv.ensureCommissionOptionsLoaded();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
      });
    });

    const role = this.permissions.currentRole();
    const audience: NoticesAudience =
      role === ROLE.STUDENT
        ? 'student'
        : role === ROLE.TEACHER
          ? 'teacher'
          : 'all';
    this.audience.set(audience);

    this.loadPage(1);
  }

  onPageChange(event: { page?: number | null; rows?: number | null }): void {
    const pageIndex = event.page ?? 0; // PrimeNG usa índice base 0
    const requestedPage = pageIndex + 1;
    this.loadPage(requestedPage);
  }

  openCreateDialog(): void {
    this.createDialogVisible.set(true);
  }

  closeCreateDialog(): void {
    this.createDialogVisible.set(false);
  }

  async addNotice() {
    try {
      await this.noticesSrv.create({
        title: this.newNotice.title?.trim(),
        content: this.newNotice.content!,
        visibleFor: (this.newNotice.visibleFor as VisibleRole | 'all') ?? 'all',
        commissionIds: this.segmentByCommission()
          ? this.selectedCommissionIds
          : undefined,
      });

      this.newNotice = {
        title: '',
        content: '',
        visibleFor: ROLE.STUDENT as VisibleRole,
        commissionTargets: [],
      };
      this.selectedCommissionIds = [];
      this.createDialogVisible.set(false);
      this.loadPage(1);
    } catch (e: any) {
      alert(String(e?.message ?? 'No se pudo publicar el aviso.'));
    }
  }

  async deleteNotice(id: number) {
    try {
      await this.noticesSrv.remove(id);
      this.loadPage(this.page());
    } catch (e) {
      console.error('[NoticesPage] error deleting notice', e);
    }
  }

  confirm(event: Event, callback: () => void, onReject?: () => void) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Estás seguro de continuar?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => callback(),
      reject: () => {
        if (onReject) {
          onReject();
        }
      },
    });
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
          this.paginatedNotices.set(resp.items ?? []);
          this.page.set(resp.page ?? 1);
          this.total.set(resp.total ?? resp.items.length);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[NoticesPage] error loading notices', err);
          const msg =
            err?.error?.message ??
            err?.message ??
            'No se pudieron cargar los avisos.';
          this.error.set(Array.isArray(msg) ? msg.join(' | ') : String(msg));
          this.paginatedNotices.set([]);
          this.loading.set(false);
        },
      });
  }
}
