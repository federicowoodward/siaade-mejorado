import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalDataComponent } from '../../../shared/components/personal_data/personal-data-component';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { GoBackService } from '../../../core/services/go_back.service';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ApiService } from '../../../core/services/api.service';
import { firstValueFrom } from 'rxjs';
import { PermissionService } from '../../../core/auth/permission.service';
import { ROLE, ROLE_IDS } from '../../../core/auth/roles';
import { UserFlagsCacheService } from '../../../core/services/user-flags-cache.service';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';
import { UiAlertAuditService } from '../../../core/services/ui-alert-audit.service';

@Component({
  selector: 'app-user-detail-page',
  standalone: true,
  imports: [
    PersonalDataComponent,
    CommonModule,
    AppBreadcrumbComponent,
    Button,
    FormsModule,
    DialogModule,
    ConfirmPopupModule,
  ],
  templateUrl: './user-detail-page.html',
  styleUrl: './user-detail-page.scss',
  providers: [ConfirmationService],
})
export class UserDetailPage implements OnInit {
  private goBack = inject(GoBackService);
  private api = inject(ApiService);
  private permissions = inject(PermissionService);
  private cache = inject(UserFlagsCacheService);
  private confirmationService = inject(ConfirmationService);
  private messages = inject(MessageService);
  private uiAlertAudit = inject(UiAlertAuditService);

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Gestión de usuarios', routerLink: '/users' },
    { label: 'Detalle de usuario' },
  ];

  userId!: string;

  // flags alumno
  isActive = signal<boolean | null>(null);
  isBlocked = signal<boolean>(false);
  blockedReason = signal<string | null>(null);
  isStudent = signal<boolean>(false);
  targetRole = signal<ROLE | null>(null);
  targetRoleId = signal<number | null>(null);
  saving = signal(false);

  // UI de motivo al bloquear acceso
  showReasonDialog = signal(false);
  reasonDraft = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.userId) {
      this.primeFromCacheThenRefresh(this.userId);
    }
  }

  back(): void {
    this.goBack.back();
  }

  get isTeacher(): boolean {
    return this.permissions.hasAnyRole([ROLE.TEACHER]);
  }

  // ---- permisos ----
  canToggleCanLogin(): boolean {
    const actorOk = this.permissions.hasAnyRole([
      ROLE.PRECEPTOR,
      ROLE.SECRETARY,
      ROLE.EXECUTIVE_SECRETARY,
    ]);
    const targetOk =
      (this.targetRoleId() ?? Infinity) < ROLE_IDS[ROLE.SECRETARY];
    return actorOk && targetOk;
  }

  canToggleIsActive(): boolean {
    const actorOk = this.permissions.hasAnyRole([
      ROLE.SECRETARY,
      ROLE.EXECUTIVE_SECRETARY,
    ]);
    const targetOk =
      (this.targetRoleId() ?? Infinity) < ROLE_IDS[ROLE.SECRETARY];
    return actorOk && targetOk;
  }

  // ---- carga de flags con caché ----
  private async primeFromCacheThenRefresh(id: string): Promise<void> {
    const cached = this.cache.get(id);
    if (cached) {
      this.isStudent.set(!!cached.isStudent);
      if ((cached as any).role) {
        this.targetRole.set((cached as any).role);
        this.targetRoleId.set(ROLE_IDS[(cached as any).role as ROLE]);
      }
      this.isActive.set(cached.isActive);
      this.isBlocked.set(!!cached.isBlocked);
      this.blockedReason.set(cached.blockedReason ?? null);
    }

    try {
      const resp: any = await firstValueFrom(
        this.api.request('GET', `users/${id}`),
      );
      const data = resp?.data ?? resp;
      this.applyUserPayload(data);
    } catch (e: any) {
      const status = e?.status ?? e?.error?.status ?? null;
      if (status === 403) {
        this.uiAlertAudit.add(this.messages, {
          severity: 'error',
          summary: 'Acceso no permitido',
          detail: 'No tenés permiso para ver este usuario.',
        });
        this.router.navigate(['/users']);
        return;
      }
      if (!cached) {
        this.isStudent.set(false);
        this.isActive.set(true);
      }
    }
  }

  private normalizeOptionalBool(
    value: boolean | null | undefined,
    fallback: boolean | null,
  ): boolean | null {
    if (value === undefined) return fallback;
    if (value === null) return null;
    return !!value;
  }

  private applyUserPayload(data: any): void {
    if (!data) return;

    const blockedReason = (data as any)?.blockedReason ?? null;
    const isBlocked = !!(data as any)?.isBlocked;
    this.blockedReason.set(blockedReason);
    this.isBlocked.set(isBlocked);

    const roleName: ROLE | null = (data?.role?.name as ROLE) ?? null;
    const roleId: number | null =
      Number(data?.role?.id) || (roleName ? ROLE_IDS[roleName] : null);
    this.targetRole.set(roleName);
    this.targetRoleId.set(roleId);

    const isStudent =
      roleName === ROLE.STUDENT || !!(data?.student ?? data?.students ?? null);
    this.isStudent.set(isStudent);

    const rawActive = data?.isActive ?? (data as any)?.is_active;
    const nextIsActive = this.normalizeOptionalBool(rawActive, this.isActive());
    this.isActive.set(nextIsActive);

    const now = Date.now();
    this.cache.set(this.userId, {
      role: roleName,
      isStudent,
      isActive: nextIsActive,
      isBlocked,
      blockedReason,
      reasonUpdatedAt: now,
      updatedAt: now,
    });
  }

  // Acceso efectivo (combina flags de rol y bloqueo global)
  accessEnabled(): boolean {
    const blocked = this.isBlocked();
    const active = this.isActive();
    if (active === false) return false;
    if (blocked) return false;
    return true;
  }

  // ---- acciones ----
  confirmAction(
    action: 'block' | 'unblock' | 'activate' | 'inactivate',
    event?: Event,
  ): void {
    if (this.saving()) return;

    const messages: Record<
      'block' | 'unblock' | 'activate' | 'inactivate',
      string
    > = {
      block: '¿Estás seguro de que querés bloquear al usuario?',
      unblock: '¿Estás seguro de que querés habilitar al usuario?',
      activate: '¿Estás seguro de que querés activar la cuenta del usuario?',
      inactivate:
        '¿Estás seguro de que querés desactivar la cuenta del usuario?',
    };

    this.confirmationService.confirm({
      target: event?.target as EventTarget,
      message: messages[action],
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        void this.runConfirmedAction(action);
      },
    });
  }

  private async runConfirmedAction(
    action: 'block' | 'unblock' | 'activate' | 'inactivate',
  ): Promise<void> {
    switch (action) {
      case 'block':
        this.reasonDraft.set('');
        this.showReasonDialog.set(true);
        return;
      case 'unblock':
        await this.enableAccess();
        return;
      case 'activate':
        await this.updateActiveState(true);
        return;
      case 'inactivate':
        await this.updateActiveState(false);
        return;
      default:
        return;
    }
  }

  private async enableAccess(): Promise<void> {
    if (this.isActive() === false) return;
    if (!this.canToggleCanLogin()) return;

    try {
      this.saving.set(true);
      const unblocked = await firstValueFrom(
        this.api.request('PATCH', `users/${this.userId}/unblock`),
      );
      this.applyUserPayload(unblocked);
    } catch (e) {
      console.error('[UserDetail] Error enabling access', e);
    } finally {
      this.saving.set(false);
    }
  }

  private async updateActiveState(next: boolean): Promise<void> {
    if (!this.canToggleIsActive()) return;

    try {
      this.saving.set(true);
      const url = next ? 'activate' : 'inactivate';
      const updated = await firstValueFrom(
        this.api.request('PATCH', `users/${this.userId}/${url}`),
      );
      this.applyUserPayload(updated);
    } catch (e) {
      console.error('[UserDetail] Error updating active state', e);
    } finally {
      this.saving.set(false);
    }
  }

  // Confirmación de bloqueo con motivo (bloquea acceso y registra motivo)
  async confirmBlockAccessWithReason(): Promise<void> {
    const reason = (this.reasonDraft() || '').trim();

    try {
      this.saving.set(true);
      const blocked = await firstValueFrom(
        this.api.request('PATCH', `users/${this.userId}/block`, { reason }),
      );
      this.applyUserPayload(blocked);
      this.showReasonDialog.set(false);
    } catch (e) {
      console.error('[UserDetail] Error blocking access', e);
    } finally {
      this.saving.set(false);
    }
  }

  cancelBlockAccess(): void {
    this.showReasonDialog.set(false);
    this.reasonDraft.set('');
  }

  onReasonDialogHide(): void {
    this.reasonDraft.set('');
  }
}
