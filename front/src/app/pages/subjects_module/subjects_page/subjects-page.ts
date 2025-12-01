import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectTableComponent } from '../../../shared/components/subjects-table/subjects-table';
import { Button } from 'primeng/button';
import { SelectModule } from 'primeng/select';
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
    FormsModule,
    AppBreadcrumbComponent,
    SubjectTableComponent,
    Button,
    SelectModule,
  ],
  templateUrl: './subjects-page.html',
  styleUrl: './subjects-page.scss',
})
export class SubjectsPage {
  private router = inject(Router);
  private permissions = inject(PermissionService);
  private catalog = inject(CareerCatalogService);

  private readonly baseSubjects = signal<
    { id: number; name: string; teacherId: string | null }[]
  >([]);

  readonly selectedYear = signal<number | null>(null);

  // Solo números sin símbolos raros
  private readonly cleanYearLabel = (year: number) => `${year} año`;

  readonly yearFilterOptions = [
    { label: 'Todas', value: null },
    { label: this.cleanYearLabel(1), value: 1 },
    { label: this.cleanYearLabel(2), value: 2 },
    { label: this.cleanYearLabel(3), value: 3 },
  ];

  private readonly subjectYearMap = computed(() => {
    const periods = this.catalog.periods() as any[];
    const yearBySubject = new Map<number, number>();
    for (const period of periods ?? []) {
      const subjects = period?.subjects ?? [];
      for (const subject of subjects) {
        const id = Number(subject?.id ?? 0);
        const yearNo = Number(subject?.careerOrdering?.yearNo ?? 0);
        if (!id || !Number.isFinite(yearNo) || yearNo <= 0) {
          continue;
        }
        yearBySubject.set(id, yearNo);
      }
    }
    return yearBySubject;
  });

  readonly filteredSubjects = computed(() => {
    const base = this.baseSubjects();
    if (!base.length) {
      return base;
    }
    const selected = this.selectedYear();
    if (selected == null) {
      return base;
    }
    const yearMap = this.subjectYearMap();
    return base.filter((subject) => yearMap.get(subject.id) === selected);
  });

  // Capturamos el listado original de materias (sin filtro por año)
  private readonly captureSubjectsEffect = effect(() => {
    if (this.baseSubjects().length) {
      return;
    }
    const subjects = this.catalog.basicSubjects();
    if (subjects && subjects.length) {
      this.baseSubjects.set(subjects);
    }
  });

  private readonly syncFilteredSubjectsEffect = effect(() => {
    const filtered = this.filteredSubjects();
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

  fetchSubjects(filters?: { year?: number | null }) {
    const year = filters?.year ?? null;
    this.selectedYear.set(year);
  }
}
