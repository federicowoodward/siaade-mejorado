import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PersonalDataComponent } from '../../../shared/components/personal_data/personal-data-component';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { GoBackService } from '../../../core/services/go_back.service';
import { FormsModule } from '@angular/forms';
import { ToggleButtonModule } from 'primeng/togglebutton';
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
    ToggleButtonModule,
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
  private dialogCloseMode: 'none' | 'confirm' | 'cancel' = 'none';

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
      this.canLogin.set(cached.canLogin);
    }

    try {
      const resp: any = await firstValueFrom(
        this.api.request('GET', `users/${id}`),
      );
      const data = resp?.data ?? resp;
      const blockedReason = (data as any)?.blockedReason ?? null;
      const isBlocked = !!(data as any)?.isBlocked;
      this.blockedReason.set(blockedReason);
      this.isBlocked.set(isBlocked);
      const roleName: ROLE | null = (data?.role?.name as ROLE) ?? null;
      const roleId: number | null =
        Number(data?.role?.id) || (roleName ? ROLE_IDS[roleName] : null);
      this.targetRole.set(roleName);
      this.targetRoleId.set(roleId);
      const student = data?.student ?? data?.students ?? null;
      if (student) {
        this.isStudent.set(true);
        const isActive = student?.isActive ?? student?.is_active ?? null;
        const canLogin = student?.canLogin ?? student?.can_login ?? null;
        const nextIsActive = isActive === null ? null : !!isActive;
        const nextCanLogin = canLogin === null ? null : !!canLogin;
        this.isActive.set(nextIsActive);
        this.canLogin.set(nextCanLogin);
        this.cache.set(id, {
          role: roleName,
          isStudent: true,
          isActive: nextIsActive,
          canLogin: nextCanLogin,
          isBlocked,
          blockedReason,
          reasonUpdatedAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else if (roleName === ROLE.TEACHER && data?.teacher) {
        this.isStudent.set(false);
        const isActive =
          data.teacher?.isActive ?? data.teacher?.is_active ?? true;
        const canLogin =
          data.teacher?.canLogin ?? data.teacher?.can_login ?? true;
        this.isActive.set(isActive === null ? null : !!isActive);
        this.canLogin.set(canLogin === null ? null : !!canLogin);
        this.cache.set(id, {
          role: roleName,
          isStudent: false,
          isActive: this.isActive(),
          canLogin: this.canLogin(),
          isBlocked,
          blockedReason,
          reasonUpdatedAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else if (roleName === ROLE.PRECEPTOR && data?.preceptor) {
        this.isStudent.set(false);
        const isActive =
          data.preceptor?.isActive ?? data.preceptor?.is_active ?? true;
        const canLogin =
          data.preceptor?.canLogin ?? data.preceptor?.can_login ?? true;
        this.isActive.set(isActive === null ? null : !!isActive);
        this.canLogin.set(canLogin === null ? null : !!canLogin);
        this.cache.set(id, {
          role: roleName,
          isStudent: false,
          isActive: this.isActive(),
          canLogin: this.canLogin(),
          isBlocked,
          blockedReason,
          reasonUpdatedAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else {
        this.isStudent.set(false);
        const fallbackIsActive =
          data?.isActive ?? (data as any)?.is_active ?? true;
        this.isActive.set(fallbackIsActive === null ? null : !!fallbackIsActive);
        const fallbackCanLogin =
          data?.canLogin ?? (data as any)?.can_login ?? true;
        this.canLogin.set(fallbackCanLogin === null ? null : !!fallbackCanLogin);
        this.cache.set(id, {
          role: roleName,
          isStudent: false,
          isActive: this.isActive(),
          canLogin: this.canLogin(),
          isBlocked,
          blockedReason,
          reasonUpdatedAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
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

  // Acceso efectivo (combina flags de rol y bloqueo global)
  accessEnabled(): boolean {
    const blocked = this.isBlocked();
    const flag = this.canLogin();
    if (blocked || flag === false) return false;
    return true;
  }

  // ---- acciones ----
  async onToggleCanLogin(next: boolean): Promise<void> {
    console.debug('[UserDetail] onToggleCanLogin called with next=', next, {
      canToggle: this.canToggleCanLogin(),
      isActive: this.isActive(),
      currentCanLogin: this.canLogin(),
      dialogOpen: this.showReasonDialog(),
    });
    if (!this.canToggleCanLogin()) return;
    const prefix = this.getUpdatePrefix();
    if (!prefix) return;
    if (this.isActive() === false && next) return;

    // Si vamos a bloquear (next=false), primero pedir motivo
    if (next === false) {
      // mantener visualmente habilitado hasta confirmar (revertir inmediatamente)
      this.canLogin.set(true);
      this.reasonDraft.set('');
      console.debug('[UserDetail] Opening reason dialog for block');
      this.showReasonDialog.set(true);
      this.dialogCloseMode = 'none';
      return;
    }

    // Si habilitamos acceso (next=true), solo actualizamos flag
    try {
      this.saving.set(true);
      console.debug('[UserDetail] Enabling access...');
      await firstValueFrom(
        this.api.update('users', this.userId, { [`${prefix}canLogin`]: true }),
      );
      // Limpia motivo si existía
      await firstValueFrom(
        this.api.request('PATCH', `users/${this.userId}/unblock`),
      );
      this.canLogin.set(true);
      this.isBlocked.set(false);
      this.blockedReason.set(null);
      this.cache.update(this.userId, { canLogin: true });
      console.debug('[UserDetail] Access enabled and reason cleared');
    } catch (e) {
      // noop
      console.error('[UserDetail] Error enabling access', e);
    } finally {
      this.saving.set(false);
    }
  }

  async onToggleIsActive(next: boolean): Promise<void> {
    if (!this.canToggleIsActive()) return;
    const prefix = this.getUpdatePrefix();
    if (!prefix) return;
    try {
      this.saving.set(true);
      const payload: any = {
        [`${prefix}isActive`]: !!next,
        isActive: !!next,
      };
      if (next === false) payload[`${prefix}canLogin`] = false;
      await firstValueFrom(this.api.update('users', this.userId, payload));
      this.isActive.set(!!next);
      if (next === false) this.canLogin.set(false);
      this.cache.update(this.userId, {
        isActive: !!next,
        canLogin: next ? this.canLogin() : false,
      });
    } catch (e) {
      // noop
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
      console.debug('[UserDetail] Confirming block with reason=', reason);
      // 1) Cortar acceso
      await firstValueFrom(
        this.api.update('users', this.userId, { [`${prefix}canLogin`]: false }),
      );
      // 2) Registrar motivo global
      await firstValueFrom(
        this.api.request('PATCH', `users/${this.userId}/block`, { reason }),
      );
      this.canLogin.set(false);
      this.isBlocked.set(true);
      this.blockedReason.set(reason || null);
      this.cache.update(this.userId, { canLogin: false });
      this.dialogCloseMode = 'confirm';
      this.showReasonDialog.set(false);
      console.debug('[UserDetail] Blocked access and closed dialog');
    } catch (e) {
      // Si falla, mantenemos el toggle visual habilitado
      this.canLogin.set(true);
      console.error('[UserDetail] Error blocking access', e);
    } finally {
      this.saving.set(false);
    }
  }

  cancelBlockAccess(): void {
    console.debug('[UserDetail] Cancel block dialog');
    this.dialogCloseMode = 'cancel';
    this.showReasonDialog.set(false);
    // Revertir visualmente el toggle sin condiciones
    this.canLogin.set(true);
  }

  onReasonDialogHide(): void {
    // Se cerró el diálogo (X, ESC o click afuera). Si no fue por confirmación, actúa como cancelar.
    if (this.dialogCloseMode !== 'confirm') {
      this.canLogin.set(true);
    }
    this.dialogCloseMode = 'none';
  }

  onAccessToggleChange(event: any, toggle: any): void {
    const previous = this.accessEnabled();
    const next = !!event.checked;

    this.confirm(
      event.originalEvent,
      () => this.onToggleCanLogin(next),
      () => {
        toggle.checked = previous;
      },
    );
  }

  onIsActiveToggleChange(event: any, toggle: any): void {
    const previous = this.isActive() !== false;
    const next = !!event.checked;

    this.confirm(
      event.originalEvent,
      () => this.onToggleIsActive(next),
      () => {
        toggle.checked = previous;
      },
    );
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
}
