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
import { Router } from '@angular/router';

import {
  CatalogsService,
  CareerStudentItem,
  CareerStudentsByCommissionResponse,
} from '@/core/services/catalogs.service';
import { GoBackService } from '@/core/services/go_back.service';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';

@Component({
  selector: 'app-career-students-page',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './career-students.page.html',
  styleUrl: './career-students.page.scss',
})
export class CareerStudentsPage implements OnInit, OnDestroy {
  private readonly catalogs = inject(CatalogsService);
  private readonly router = inject(Router);

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Gestión de materias', routerLink: '/subjects' },
    {
      label: 'Información de la carrera',
      routerLink: '/subjects/career-data',
    },
    { label: 'Alumnos de la carrera' },
  ];

  loading = signal(true);
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
        const dni = student.user?.dni ?? '';
        const cuil = student.user?.cuil ?? '';

        flattened.push({
          studentId: student.userId,
          commissionId: group.commissionId ?? student.commissionId ?? null,
          commissionLetter: group.commissionLetter ?? null,
          legajo: student.legajo,
          studentStartYear: student.studentStartYear,
          isActive: student.isActive ?? null,
          user: {
            fullName: fullName || firstName || lastName || 'Sin nombre',
            dni,
            cuil,
            email: student.user?.email ?? '',
          },
        });
      }
      console.log(students);
    }

    return flattened;
  });

  readonly filteredRows = computed<CareerStudentItem[]>(() => {
    const q = this.search().trim().toLowerCase();
    const items = this.rows();
    if (!q) return items;
    const normalizedQuery = q.replace(/[^0-9a-z]/gi, '');

    return items.filter((r) => {
      const name = r.user.fullName?.toLowerCase() ?? '';
      const email = r.user.email?.toLowerCase() ?? '';
      const dni = r.user.dni?.toLowerCase() ?? '';
      const cuil = r.user.cuil?.toLowerCase() ?? '';

      const normalizedDni = dni.replace(/[^0-9a-z]/gi, '');
      const normalizedCuil = cuil.replace(/[^0-9a-z]/gi, '');

      return (
        name.includes(q) ||
        email.includes(q) ||
        dni.includes(q) ||
        cuil.includes(q) ||
        (!!normalizedQuery &&
          (normalizedDni.includes(normalizedQuery) ||
            normalizedCuil.includes(normalizedQuery)))
      );
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
}
