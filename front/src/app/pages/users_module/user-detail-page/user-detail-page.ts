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
    { label: 'GestiÃ³n de usuarios', routerLink: '/users' },
    { label: 'Detalle de usuario' },
  ];
  userId!: string;
  // flags alumno
  isActive = signal<boolean | null>(null);
  canLogin = signal<boolean | null>(null);
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
  ngOnInit() {
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
  // ---- carga de flags con cachÃ© ----
  private async primeFromCacheThenRefresh(id: string): Promise<void> {
    const cached = this.cache.get(id);
    if (cached) {
      this.isStudent.set(!!cached.isStudent);
      if ((cached as any).role) {
        this.targetRole.set((cached as any).role);
        this.targetRoleId.set(ROLE_IDS[(cached as any).role as ROLE]);
      }
      this.isActive.set(cached.isActive);
      this.canLogin.set(cached.canLogin);
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
          detail: 'No tenÃ©s permiso para ver este usuario.',
        });
        this.router.navigate(['/users']);
        return;
      }
      if (!cached) {
        this.isStudent.set(false);
        this.isActive.set(true);
        this.canLogin.set(true);
      }
    }
  }
  private getUpdatePrefix(): string | null {
    const role = this.targetRole();
    if (role === ROLE.STUDENT) return 'student.';
    if (role === ROLE.TEACHER) return 'teacher.';
    if (role === ROLE.PRECEPTOR) return 'preceptor.';
    return null;
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
    const now = Date.now();
    const updateCache = (entry: {
      isStudent: boolean;
      isActive: boolean | null;
      canLogin: boolean | null;
    }) => {
      this.cache.set(this.userId, {
        role: roleName,
        isStudent: entry.isStudent,
        isActive: entry.isActive,
        canLogin: entry.canLogin,
        isBlocked,
        blockedReason,
        reasonUpdatedAt: now,
        updatedAt: now,
      });
    };
    const student = data?.student ?? data?.students ?? null;
    if (student) {
      this.isStudent.set(true);
      const rawActive =
        ('isActive' in student ? student.isActive : undefined) ??
        student?.is_active;
      const rawCanLogin =
        ('canLogin' in student ? student.canLogin : undefined) ??
        student?.can_login;
      const nextIsActive = this.normalizeOptionalBool(
        rawActive,
        this.isActive(),
      );
      const nextCanLogin = this.normalizeOptionalBool(
        rawCanLogin,
        this.canLogin(),
      );
      this.isActive.set(nextIsActive);
      this.canLogin.set(nextCanLogin);
      updateCache({
        isStudent: true,
        isActive: nextIsActive,
        canLogin: nextCanLogin,
      });
      return;
    }
    if (roleName === ROLE.TEACHER && data?.teacher) {
      this.isStudent.set(false);
      const rawActive =
        data.teacher?.isActive ?? data.teacher?.is_active ?? data?.isActive;
      const rawCanLogin =
        data.teacher?.canLogin ?? data.teacher?.can_login ?? data?.canLogin;
      const nextIsActive = this.normalizeOptionalBool(
        rawActive,
        this.isActive(),
      );
      const nextCanLogin = this.normalizeOptionalBool(
        rawCanLogin,
        this.canLogin(),
      );
      this.isActive.set(nextIsActive);
      this.canLogin.set(nextCanLogin);
      updateCache({
        isStudent: false,
        isActive: this.isActive(),
        canLogin: this.canLogin(),
      });
      return;
    }
    if (roleName === ROLE.PRECEPTOR && data?.preceptor) {
      this.isStudent.set(false);
      const rawActive =
        data.preceptor?.isActive ?? data.preceptor?.is_active ?? data?.isActive;
      const rawCanLogin =
        data.preceptor?.canLogin ??
        data.preceptor?.can_login ??
        data?.canLogin;
      const nextIsActive = this.normalizeOptionalBool(
        rawActive,
        this.isActive(),
      );
      const nextCanLogin = this.normalizeOptionalBool(
        rawCanLogin,
        this.canLogin(),
      );
      this.isActive.set(nextIsActive);
      this.canLogin.set(nextCanLogin);
      updateCache({
        isStudent: false,
        isActive: this.isActive(),
        canLogin: this.canLogin(),
      });
      return;
    }
    this.isStudent.set(false);
    const rawActive = data?.isActive ?? (data as any)?.is_active;
    const rawCanLogin = data?.canLogin ?? (data as any)?.can_login;
    const nextIsActive = this.normalizeOptionalBool(
      rawActive,
      this.isActive(),
    );
    const nextCanLogin = this.normalizeOptionalBool(
      rawCanLogin,
      this.canLogin(),
    );
    this.isActive.set(nextIsActive);
    this.canLogin.set(nextCanLogin);
    updateCache({
      isStudent: false,
      isActive: this.isActive(),
      canLogin: this.canLogin(),
    });
  }
  // Acceso efectivo (combina flags de rol y bloqueo global)
  accessEnabled(): boolean {
    const blocked = this.isBlocked();
    const flag = this.canLogin();
    if (blocked || flag === false) return false;
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
      block: '¿Estás seguro de que quieres bloquear al usuario?',
      unblock: '¿Estás seguro de que quieres habilitar al usuario?',
      activate: '¿Estás seguro de que quieres activar al usuario?',
      inactivate: '¿Estás seguro de que quieres inactivar al usuario?',
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
    if (!this.canToggleCanLogin()) return;
    const prefix = this.getUpdatePrefix();
    if (!prefix) return;
    if (this.isActive() === false) return;
    try {
      this.saving.set(true);
      const updated = await firstValueFrom(
        this.api.update('users', this.userId, {
          [`${prefix}canLogin`]: true,
        }),
      );
      this.applyUserPayload(updated);
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
    const prefix = this.getUpdatePrefix();
    const payload: any = { isActive: !!next };
    if (prefix) {
      payload[`${prefix}isActive`] = !!next;
      if (next === false) payload[`${prefix}canLogin`] = false;
    }
    try {
      this.saving.set(true);
      const data = await firstValueFrom(
        this.api.update('users', this.userId, payload),
      );
      this.applyUserPayload(data);
    } catch (e) {
      console.error('[UserDetail] Error updating active state', e);
    } finally {
      this.saving.set(false);
    }
  }
  // Confirmación de bloqueo con motivo (bloquea acceso y registra motivo)
  async confirmBlockAccessWithReason(): Promise<void> {
    const prefix = this.getUpdatePrefix();
    if (!prefix) return;
    const reason = (this.reasonDraft() || '').trim();
    try {
      this.saving.set(true);
      const updated = await firstValueFrom(
        this.api.update('users', this.userId, {
          [`${prefix}canLogin`]: false,
        }),
      );
      this.applyUserPayload(updated);
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
