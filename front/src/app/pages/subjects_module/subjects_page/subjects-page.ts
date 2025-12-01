import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectTableComponent } from '../../../shared/components/subjects-table/subjects-table';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';
import { PermissionService } from '@/core/auth/permission.service';
import { ROLE } from '@/core/auth/roles';
import { CareerCatalogService } from '../../../core/services/career-catalog.service';

@Component({
  selector: 'app-subjects-page',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    SubjectTableComponent,
    Button,
  ],
  templateUrl: './subjects-page.html',
  styleUrl: './subjects-page.scss',
})
export class SubjectsPage {
  private router = inject(Router);
  private permissions = inject(PermissionService);
  private catalog = inject(CareerCatalogService);

  private readonly originalSubjects = signal<
    { id: number; name: string; teacherId: string | null }[]
  >([]);

  readonly selectedYear = signal<number | null>(null);

  // Capturamos el listado original de materias (sin filtro por a�o)
  private readonly captureSubjectsEffect = effect(() => {
    const current = this.originalSubjects();
    if (current.length) {
      return;
    }
    const subjects = this.catalog.basicSubjects();
    if (subjects && subjects.length) {
      this.originalSubjects.set(subjects);
    }
  });

  // A�os disponibles seg�n las materias visibles para el usuario actual
  readonly availableYears = computed(() => {
    const base = this.originalSubjects();
    const periods = this.catalog.periods() as any[];
    if (!base.length || !periods.length) return [];

    const yearBySubject = new Map<number, number>();
    for (const period of periods) {
      const subjects = period?.subjects ?? [];
      for (const subject of subjects) {
        const id = Number(subject?.id ?? 0);
        const yearNo = Number(subject?.careerOrdering?.yearNo ?? 0);
        if (!id || !Number.isFinite(yearNo) || yearNo <= 0) continue;
        yearBySubject.set(id, yearNo);
      }
    }

    const years = new Set<number>();
    for (const subj of base) {
      const year = yearBySubject.get(subj.id);
      if (year && Number.isFinite(year)) {
        years.add(year);
      }
    }

    return Array.from(years).sort((a, b) => a - b);
  });

  // Aplica el filtro sobre el listado usado por la tabla compartida
  private readonly applyYearFilterEffect = effect(() => {
    const selected = this.selectedYear();
    const base = this.originalSubjects();
    const periods = this.catalog.periods() as any[];

    if (!base.length || !periods.length) {
      return;
    }

    const yearBySubject = new Map<number, number>();
    for (const period of periods) {
      const subjects = period?.subjects ?? [];
      for (const subject of subjects) {
        const id = Number(subject?.id ?? 0);
        const yearNo = Number(subject?.careerOrdering?.yearNo ?? 0);
        if (!id || !Number.isFinite(yearNo) || yearNo <= 0) continue;
        yearBySubject.set(id, yearNo);
      }
    }

    const filtered =
      selected == null
        ? base
        : base.filter((s) => yearBySubject.get(s.id) === selected);

    // Mutamos el estado interno del servicio para que la tabla use la lista filtrada.
    (this.catalog as any)._basicSubjects.set(filtered);
  });

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Gestión de materias', routerLink: '/subjects' },
    { label: 'Listado de materias' },
  ];

  get isTeacher(): boolean {
    return this.permissions.currentRole() === ROLE.TEACHER;
  }

  goToNewSubject() {
    this.router.navigate(['subjects/new']);
  }
  goToCareerInfo() {
    this.router.navigate(['subjects/career-data']);
  }

  onYearFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    const value = target?.value?.trim() ?? '';
    if (!value) {
      this.selectedYear.set(null);
      return;
    }
    const numeric = Number(value);
    this.selectedYear.set(
      Number.isFinite(numeric) && numeric > 0 ? numeric : null,
    );
  }
}
