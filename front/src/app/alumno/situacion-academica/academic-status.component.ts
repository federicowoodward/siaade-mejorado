import { Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import {
  StudentStatusService,
  StudentSubjectCard,
} from '../../core/services/student-status.service';

type YearGroup = { label: string; order: number; subjects: StudentSubjectCard[] };

@Component({
  selector: 'app-academic-status-student',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    TableModule,
  ],
  templateUrl: './academic-status.component.html',
  styleUrl: './academic-status.component.scss',
})
export class AcademicStatusComponent implements OnInit {
  private readonly statusService = inject(StudentStatusService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly cards = this.statusService.status;
  readonly loading = this.statusService.loading;
  readonly summary = this.statusService.summary;

  private readonly yearGroups = computed<YearGroup[]>(() => {
    const map = new Map<string, YearGroup>();
    this.cards().forEach((card) => {
      const key = card.yearLabel;
      if (!map.has(key)) {
        map.set(key, { label: key, order: this.getYearOrder(card), subjects: [] });
      }
      map.get(key)!.subjects.push(card);
    });
    return Array.from(map.values())
      .map((group) => ({
        ...group,
        subjects: this.sortSubjects(group.subjects),
      }))
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.label.localeCompare(b.label);
      });
  });

  readonly groupedCards = computed<YearGroup[]>(() => {
    const groups = this.yearGroups();
    const summary = this.summary();
    const limit = this.resolveVisibleYearLimit(
      groups,
      summary?.academicYear ?? null,
    );
    if (!limit) return groups;
    return groups.filter((group) => {
      if (!Number.isFinite(group.order) || group.order <= 0) return true;
      return group.order <= limit;
    });
  });

  private sortSubjects(subjects: StudentSubjectCard[]): StudentSubjectCard[] {
    return [...subjects].sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }

  private resolveVisibleYearLimit(
    groups: YearGroup[],
    preferredLimit?: number | null,
  ): number | null {
    if (
      typeof preferredLimit === 'number' &&
      Number.isFinite(preferredLimit)
    ) {
      const normalized = Math.floor(preferredLimit);
      if (normalized > 0) {
        return Math.min(normalized, 3);
      }
    }
    const validOrders = groups
      .map((group) => group.order)
      .filter((order) => Number.isFinite(order) && order > 0);
    if (!validOrders.length) return null;
    const highest = Math.max(...validOrders);
    return Math.min(highest, 3);
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.statusService
      .loadStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  stateSeverity(
    condition: string | null,
  ): 'success' | 'info' | 'danger' | 'warning' {
    if (!condition) return 'warning';
    const value = condition.toLowerCase();
    if (value.includes('promo') || value.includes('apro')) return 'success';
    if (value.includes('regular')) return 'info';
    if (value.includes('libre')) return 'danger';
    return 'warning';
  }

  goToMesas(subjectId?: number): void {
    const queryParams = subjectId ? { subjectId } : undefined;
    void this.router.navigate(['/alumno/mesas'], { queryParams });
  }

  viewSubjectDetail(card: StudentSubjectCard): void {
    void this.router.navigate(['/alumno/situacion-academica', card.subjectId]);
  }

  private getYearOrder(card: StudentSubjectCard): number {
    if (typeof card.yearNumber === 'number' && Number.isFinite(card.yearNumber)) {
      return card.yearNumber;
    }
    const match = card.yearLabel.match(/\d+/);
    if (match) {
      const numeric = Number(match[0]);
      if (Number.isFinite(numeric)) return numeric;
    }
    return Number.POSITIVE_INFINITY;
  }

  trackGroup(_: number, group: YearGroup): string {
    return `${group.label}-${group.order}`;
  }

  formatRegisteredSince(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
  }

  academicYearText(value: number | null | undefined): string {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return '-';
    }
    return `${value}º año`;
  }

}
