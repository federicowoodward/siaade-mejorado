import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { Router } from '@angular/router';
import { PermissionService } from '@/core/auth/permission.service';
import { ROLE } from '@/core/auth/roles';

import {
  CatalogsService,
  CareerStudentItem,
  CareerStudentsByCommissionResponse,
} from '@/core/services/catalogs.service';

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
  ],
  templateUrl: './career-students.page.html',
  styleUrl: './career-students.page.scss',
})
export class CareerStudentsPage implements OnInit, OnDestroy {
  private readonly catalogs = inject(CatalogsService);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);

  loading = signal(true);
  saving = signal(false);
  error = signal<string | null>(null);

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

  // ---- Permisos para toggles ----
  canToggleCanLogin(): boolean {
    return this.permissions.hasAnyRole([
      ROLE.PRECEPTOR,
      ROLE.SECRETARY,
      ROLE.EXECUTIVE_SECRETARY,
    ]);
  }

  canToggleIsActive(): boolean {
    return this.permissions.hasAnyRole([
      ROLE.SECRETARY,
      ROLE.EXECUTIVE_SECRETARY,
    ]);
  }

  // ---- Acciones ----
  async onToggleCanLogin(row: CareerStudentItem, next: boolean): Promise<void> {
    if (!this.canToggleCanLogin()) return;
    if (row.isActive === false) return; // inactivo: canLogin queda false
    try {
      this.saving.set(true);
      await this.catalogs['api'].update('users', row.studentId, {
        'student.canLogin': !!next,
      }).toPromise();
      row.canLogin = !!next;
    } catch (e) {
      // revertir UI si falla
      row.canLogin = !next;
    } finally {
      this.saving.set(false);
    }
  }

  async onToggleIsActive(row: CareerStudentItem, next: boolean): Promise<void> {
    if (!this.canToggleIsActive()) return;
    try {
      this.saving.set(true);
      const payload: any = { 'student.isActive': !!next };
      if (next === false) payload['student.canLogin'] = false; // regla de negocio
      await this.catalogs['api'].update('users', row.studentId, payload).toPromise();
      row.isActive = !!next;
      if (row.isActive === false) row.canLogin = false;
    } catch (e) {
      // revertir UI si falla
      row.isActive = !next;
    } finally {
      this.saving.set(false);
    }
  }
}
