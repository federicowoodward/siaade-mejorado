import {
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';
import { ROLE } from '@/core/auth/roles';
import { RbacService } from '@/core/rbac/rbac.service';
import { ApiService } from '@/core/services/api.service';

import {
  CatalogsService,
  CareerStudentItem,
  CareerStudentsByCommissionResponse,
} from '@/core/services/catalogs.service';
import { DisableIfUnauthorizedDirective } from '@/shared/directives/disable-if-unauthorized.directive';
import { CanAnyRoleDirective } from '@/shared/directives/can-any-role.directive';
import { GoBackService } from '@/core/services/go_back.service';

@Component({
  selector: 'app-career-students-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    ToggleButtonModule,
    DialogModule,
    DisableIfUnauthorizedDirective,
    CanAnyRoleDirective,
  ],
  templateUrl: './career-students.page.html',
  styleUrl: './career-students.page.scss',
})
export class CareerStudentsPage implements OnInit, OnDestroy {
  private readonly catalogs = inject(CatalogsService);
  private readonly router = inject(Router);
  private readonly rbac = inject(RbacService);
  private readonly api = inject(ApiService);
  readonly ROLE = ROLE;
  private readonly accessRoles: ROLE[] = [
    ROLE.PRECEPTOR,
    ROLE.SECRETARY,
    ROLE.EXECUTIVE_SECRETARY,
  ];
  private readonly statusRoles: ROLE[] = [
    ROLE.SECRETARY,
    ROLE.EXECUTIVE_SECRETARY,
  ];

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);
  // UI de motivo al bloquear acceso
  showReasonDialog = signal(false);
  reasonDraft = signal('');
  // fila seleccionada para bloquear
  private pendingRow: CareerStudentItem | null = null;
  private dialogCloseMode: 'none' | 'confirm' | 'cancel' = 'none';

  private response = signal<CareerStudentsByCommissionResponse | null>(null);

  search = signal('');
  year = signal<number | null>(null);

  readonly rows = computed<CareerStudentItem[]>(() => {
    const data = this.response();
    if (!data) return [];
    const groups = data.commissions ?? [];
    const flattened: CareerStudentItem[] = [];

    for (const group of groups) {
      const students = group?.students ?? [];
      for (const student of students) {
        if (!student?.userId) continue;
        const firstName = student.user?.name ?? '';
        const lastName = student.user?.lastName ?? '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

        flattened.push({
          studentId: student.userId,
          commissionId: group.commissionId ?? student.commissionId ?? null,
          commissionLetter: group.commissionLetter ?? null,
          legajo: student.legajo,
          studentStartYear: student.studentStartYear,
          isActive: student.isActive ?? null,
          canLogin: student.canLogin ?? null,
          user: {
            name: fullName || firstName || lastName || 'Sin nombre',
            email: student.user?.email ?? '',
          },
        });
      }
    }

    return flattened;
  });

  readonly filteredRows = computed<CareerStudentItem[]>(() => {
    const q = this.search().trim().toLowerCase();
    const items = this.rows();
    if (!q) return items;
    return items.filter((r) => {
      const name = r.user.name?.toLowerCase() ?? '';
      const email = r.user.email?.toLowerCase() ?? '';
      return name.includes(q) || email.includes(q);
    });
  });

  ngOnInit(): void {
    this.fetch();
  }

  ngOnDestroy(): void {}

  private fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    const careerId = 1;
    const selectedYear = this.year();
    const opts = selectedYear ? { studentStartYear: selectedYear } : undefined;

    this.catalogs.getCareerStudentsByCommission(careerId, opts).subscribe({
      next: (res) => {
        const normalized: CareerStudentsByCommissionResponse = {
          career: res.career ?? { id: careerId },
          filters: {
            studentStartYear: res.filters?.studentStartYear ?? null,
          },
          commissions: res.commissions ?? [],
        };
        this.response.set(normalized);
        this.year.set(normalized.filters.studentStartYear);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el listado de alumnos.');
        this.loading.set(false);
      },
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value ?? '');
  }

  onApplyYearFilter(): void {
    this.fetch();
  }

  rowsTrackBy(_: number, row: CareerStudentItem): string {
    return row.studentId;
  }

  viewStudent(studentId: string): void {
    this.router.navigate(['/users/user_detail', studentId]);
  }

  private readonly GoBackService = inject(GoBackService);
  back() {
    this.GoBackService.back();
  }

  // ---- Acciones ----
  async onToggleCanLogin(row: CareerStudentItem, next: boolean): Promise<void> {
    console.debug('[CareerStudents] onToggleCanLogin', { next, row });
    if (!this.rbac.hasAny(this.accessRoles)) return;
    if (row.isActive === false && next) return; // inactivo: no habilitar

    // Si vamos a bloquear (next=false), primero pedir motivo
    if (next === false) {
      // mantener visualmente habilitado hasta confirmar (revertir inmediatamente)
      row.canLogin = true;
      this.pendingRow = row;
      this.reasonDraft.set('');
      this.dialogCloseMode = 'none';
      this.showReasonDialog.set(true);
      return;
    }

    // habilitar (next=true) => actualizar flag y limpiar motivo
    try {
      this.saving.set(true);
      await this.api
        .update('users', row.studentId, { 'student.canLogin': true })
        .toPromise();
      await this.api
        .request('PATCH', `users/${row.studentId}/unblock`)
        .toPromise();
      row.canLogin = true;
    } catch (e) {
      console.error('[CareerStudents] enable access error', e);
      row.canLogin = false;
    } finally {
      this.saving.set(false);
    }
  }

  async onToggleIsActive(row: CareerStudentItem, next: boolean): Promise<void> {
    if (!this.rbac.hasAny(this.statusRoles)) return;
    try {
      this.saving.set(true);
      const payload: any = { 'student.isActive': !!next };
      if (next === false) payload['student.canLogin'] = false; // regla de negocio
      await this.api.update('users', row.studentId, payload).toPromise();
      row.isActive = !!next;
      if (row.isActive === false) row.canLogin = false;
    } catch (e) {
      // revertir UI si falla
      row.isActive = !next;
    } finally {
      this.saving.set(false);
    }
  }

  // Confirmación de bloqueo con motivo (bloquea acceso y registra motivo)
  async confirmBlockAccessWithReason(): Promise<void> {
    const row = this.pendingRow;
    if (!row) return;
    const reason = (this.reasonDraft() || '').trim();
    try {
      this.saving.set(true);
      await this.api
        .update('users', row.studentId, { 'student.canLogin': false })
        .toPromise();
      await this.api
        .request('PATCH', `users/${row.studentId}/block`, { reason })
        .toPromise();
      row.canLogin = false;
      this.dialogCloseMode = 'confirm';
      this.showReasonDialog.set(false);
      this.pendingRow = null;
    } catch (e) {
      console.error('[CareerStudents] block access error', e);
      row.canLogin = true;
    } finally {
      this.saving.set(false);
    }
  }

  cancelBlockAccess(): void {
    this.dialogCloseMode = 'cancel';
    this.showReasonDialog.set(false);
    if (this.pendingRow) {
      this.pendingRow.canLogin = true;
      this.pendingRow = null;
    }
  }

  onReasonDialogHide(): void {
    if (this.dialogCloseMode !== 'confirm') {
      if (this.pendingRow) {
        this.pendingRow.canLogin = true;
        this.pendingRow = null;
      }
    }
    this.dialogCloseMode = 'none';
  }
}
