import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersTableComponent } from '../../../shared/components/users-table/users-table.component';
import { Button } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { ROLE, ROLE_BY_ID } from '../../../core/auth/roles';
import { UserRow } from '../../../core/models/users-table.models';
import { mapApiUserToRow } from '../../../shared/adapters/users.adapter';
import { ApiCacheService } from '../../../core/cache/api-cache.service';
import { environment as env } from 'environments/environment';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    UsersTableComponent,
    Button,
    DialogModule,
  ],
  templateUrl: './users-page.html',
  styleUrl: './users-page.scss',
})
export class UsersPage {
  private router = inject(Router);
  private api = inject(ApiService);
  private permissions = inject(PermissionService);
  private cache = inject(ApiCacheService);

  public ROLE = ROLE;
  viewerRole: ROLE | null = this.permissions.currentRole();

  rows = signal<UserRow[]>([]);

  // Estado de acceso seleccionado (solo lectura)
  selectedUserId = signal<string | null>(null);
  selectedUserName = signal<string | null>(null);
  selectedFlagsLoading = signal(false);
  selectedFlagsError = signal<string | null>(null);
  selectedFlags = signal<{
    role: ROLE | null;
    isStudent: boolean;
    isActive: boolean | null;
    canLogin: boolean | null;
    isBlocked: boolean;
    blockedReason: string | null;
  } | null>(null);

  breadcrumbItems: SimpleBreadcrumbItem[] = [{ label: 'Gestión de usuarios' }];

  // Modal "Materias a cargo" (docente)
  dialogTeacher = signal<{ visible: boolean; teacherId: string | null }>({
    visible: false,
    teacherId: null,
  });
  dialogLoading = signal(false);
  dialogError = signal<string | null>(null);
  dialogData = signal<{
    teacher: {
      id: string;
      name: string;
      email: string;
      cuil: string | null;
    } | null;
    subjects: Array<{
      subject: { id: number; name: string };
      commissions: Array<{ id: number; letter: string | null }>;
    }>;
  } | null>(null);

  constructor() {
    this.init();

    effect(() => {
      this.viewerRole = this.permissions.currentRole();
    });
  }

  // Solo SECRETARIO o DIRECTIVO pueden crear usuarios
  canCreateUser(): boolean {
    return this.permissions.hasAnyRole([
      ROLE.SECRETARY,
      ROLE.EXECUTIVE_SECRETARY,
    ]);
  }

  private async init() {
    // Invalidar cache del endpoint de usuarios para evitar resultados viejos (TTL 30m)
    const base = (env.apiBaseUrl || '').replace(/\/$/, '');
    try {
      if (base) {
        await this.cache.invalidateByPrefix(`GET:${base}/users`);
      } else {
        await this.cache.invalidateByPrefix(`GET:`);
      }
    } catch {}

    this.api.getAll('users').subscribe((users) => {
      const mapped = users.map((u) =>
        mapApiUserToRow(u, (id: number) => ROLE_BY_ID[id] ?? null),
      );
      this.rows.set(mapped);
    });
  }

  goToNewUser() {
    // Navegación absoluta para evitar /users/users/create
    this.router.navigate(['/users/create']);
  }

  onRowAction(e: { actionId: string; row: UserRow }) {
    const { actionId, row } = e;

    if (actionId === 'view') {
      this.router.navigate(['/users/user_detail', row.id]);
    }
    if (actionId === 'cert') {
      this.router.navigate(['/users/certificates', row.id]);
    }
    if (actionId === 'academic') {
      this.router.navigate(['/users/student_academic_status', row.id]);
    }
    if (actionId === 'teacher-subjects') {
      this.openTeacherAssignments(row.id);
    }
  }

  onRowClick(row: UserRow) {
    const displayName = `${row.name} ${row.lastName}`.trim();
    this.selectedUserId.set(row.id);
    this.selectedUserName.set(displayName || row.email || row.cuil);
    this.loadUserAccessState(row.id);
  }

  // Abre y carga el modal de materias a cargo del docente
  private openTeacherAssignments(teacherId: string) {
    this.dialogTeacher.set({ visible: true, teacherId });
    this.dialogLoading.set(true);
    this.dialogError.set(null);
    this.dialogData.set(null);

    this.api
      .request<{
        teacher: {
          id: string;
          name: string;
          email: string;
          cuil: string | null;
        } | null;
        subjects: Array<{
          subject: { id: number; name: string };
          commissions: Array<{ id: number; letter: string | null }>;
        }>;
      }>('GET', `catalogs/teacher/${teacherId}/subject-commissions`)
      .subscribe({
        next: (data) => {
          this.dialogData.set(data);
          this.dialogLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.dialogError.set('No se pudieron cargar las materias a cargo.');
          this.dialogLoading.set(false);
        },
      });
  }

  closeTeacherDialog() {
    this.dialogTeacher.set({ visible: false, teacherId: null });
    this.dialogLoading.set(false);
    this.dialogError.set(null);
    this.dialogData.set(null);
  }

  // Lee desde backend el estado real de acceso/actividad para el usuario seleccionado
  private loadUserAccessState(userId: string): void {
    this.selectedFlagsLoading.set(true);
    this.selectedFlagsError.set(null);
    this.selectedFlags.set(null);

    this.api.request<any>('GET', `users/${userId}`).subscribe({
      next: (resp) => {
        const data = (resp as any)?.data ?? resp;
        const roleName: ROLE | null = (data?.role?.name as ROLE) ?? null;

        const student = data?.student ?? data?.students ?? null;
        let isStudent = false;
        let isActive: boolean | null = null;
        let canLogin: boolean | null = null;

        if (student) {
          isStudent = true;
          const rawActive = student?.isActive ?? student?.is_active ?? null;
          const rawCanLogin = student?.canLogin ?? student?.can_login ?? null;
          isActive = rawActive === null ? null : !!rawActive;
          canLogin = rawCanLogin === null ? null : !!rawCanLogin;
        } else if (roleName === ROLE.TEACHER && (data as any).teacher) {
          const teacher = (data as any).teacher;
          const rawActive = teacher?.isActive ?? teacher?.is_active ?? null;
          const rawCanLogin = teacher?.canLogin ?? teacher?.can_login ?? null;
          isActive = rawActive === null ? null : !!rawActive;
          canLogin = rawCanLogin === null ? null : !!rawCanLogin;
        } else if (roleName === ROLE.PRECEPTOR && (data as any).preceptor) {
          const preceptor = (data as any).preceptor;
          const rawActive = preceptor?.isActive ?? preceptor?.is_active ?? null;
          const rawCanLogin =
            preceptor?.canLogin ?? preceptor?.can_login ?? null;
          isActive = rawActive === null ? null : !!rawActive;
          canLogin = rawCanLogin === null ? null : !!rawCanLogin;
        } else {
          isStudent = false;
          isActive = true;
          canLogin = true;
        }

        const isBlocked = !!(data as any)?.isBlocked;
        const blockedReason = ((data as any)?.blockedReason ?? null) as
          | string
          | null;

        this.selectedFlags.set({
          role: roleName,
          isStudent,
          isActive,
          canLogin,
          isBlocked,
          blockedReason,
        });
        this.selectedFlagsLoading.set(false);
      },
      error: () => {
        this.selectedFlagsError.set(
          'No se pudo leer el estado de acceso de este usuario.',
        );
        this.selectedFlagsLoading.set(false);
      },
    });
  }
}
