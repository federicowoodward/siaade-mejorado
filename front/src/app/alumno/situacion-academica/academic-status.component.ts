import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
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
import { AuthService } from '../../core/services/auth.service';
import { SubjectStatusDetailComponent } from './subject-status-detail/subject-status-detail.component';

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
    SubjectStatusDetailComponent,
  ],
  templateUrl: './academic-status.component.html',
  styleUrl: './academic-status.component.scss',
})
export class AcademicStatusComponent implements OnInit {
  private readonly statusService = inject(StudentStatusService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly cards = this.statusService.status;
  readonly loading = this.statusService.loading;

  readonly groupedCards = computed<YearGroup[]>(() => {
    const map = new Map<string, YearGroup>();
    this.cards().forEach((card) => {
      const key = card.yearLabel;
      if (!map.has(key)) {
        map.set(key, { label: key, order: this.getYearOrder(card), subjects: [] });
      }
      map.get(key)!.subjects.push(card);
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.label.localeCompare(b.label);
    });
  });

  readonly studentName = signal<string | null>(null);
  selectedSubject: StudentSubjectCard | null = null;
  detailVisible = false;

  ngOnInit(): void {
    this.reload();
    this.auth
      .getUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (!user) {
          this.studentName.set(null);
          return;
        }
        const segments = [
          typeof user['name'] === 'string' ? user['name'] : null,
          typeof user['lastName'] === 'string' ? user['lastName'] : null,
        ].filter(
          (value): value is string =>
            typeof value === 'string' && value.trim().length > 0,
        );
        const fullName = segments.join(' ').trim();
        this.studentName.set(fullName.length ? fullName : user['username'] ?? null);
      });
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

  openSubjectDetail(card: StudentSubjectCard): void {
    this.selectedSubject = card;
    this.detailVisible = true;
  }

  onDetailClosed(): void {
    this.detailVisible = false;
    this.selectedSubject = null;
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
    return Number.MAX_SAFE_INTEGER;
  }

  trackGroup(_: number, group: YearGroup): string {
    return `${group.label}-${group.order}`;
  }

}
