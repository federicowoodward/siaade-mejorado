import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import {
  StudentStatusService,
  StudentSubjectCard,
  StudentSummarySubject,
  StudentSummaryYear,
} from '../../core/services/student-status.service';

type SubjectRow = StudentSummarySubject & {
  courseLabel: string;
  examsText: string;
  hasGrades: boolean;
};

type YearBlock = {
  year: number;
  label: string;
  subjects: SubjectRow[];
};

type HeaderViewModel = {
  fullName: string;
  documentNumber: string;
  registeredSinceFormatted: string;
  currentYearLabel: string;
};

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

  private readonly legacyYearGroups = computed(() =>
    this.buildLegacyYearGroups(),
  );

  readonly headerVm = computed<HeaderViewModel>(() => this.buildHeaderVm());
  private readonly summaryYearBlocks = computed<YearBlock[]>(() =>
    this.toYearBlocks(this.summary()?.years ?? []),
  );
  private readonly fallbackYearBlocks = computed<YearBlock[]>(() =>
    this.toYearBlocksFromCards(this.legacyYearGroups()),
  );

  readonly visibleYearBlocks = computed<YearBlock[]>(() => {
    const summaryBlocks = this.summaryYearBlocks();
    const blocks = summaryBlocks.length
      ? summaryBlocks
      : this.fallbackYearBlocks();
    const limit = this.summary()?.currentAcademicYear ?? null;
    if (!limit || limit <= 0) return blocks;
    return blocks.filter((block) => block.year <= limit);
  });

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

  viewSummarySubject(subject: StudentSummarySubject): void {
    if (!subject?.id) return;
    void this.router.navigate(['/alumno/situacion-academica', subject.id]);
  }

  trackYearBlock(_: number, block: YearBlock): string {
    return `${block.year}-${block.label}`;
  }

  private buildHeaderVm(): HeaderViewModel {
    const summary = this.summary();
    const normalizedName =
      this.normalizeText(summary?.fullName) ??
      this.composeFullName(summary?.firstName, summary?.lastName) ??
      'Sin nombre';
    const documentNumber =
      this.normalizeText(summary?.documentNumber) ?? 'Sin documento';
    return {
      fullName: normalizedName,
      documentNumber,
      registeredSinceFormatted: this.formatRegisteredSince(
        summary?.registeredSince,
      ),
      currentYearLabel: this.academicYearText(summary?.currentAcademicYear),
    };
  }

  private toYearBlocks(years: StudentSummaryYear[]): YearBlock[] {
    return years
      .map((year) => ({
        year: year.year,
        label: this.yearLabel(year.year),
        subjects: (year.subjects ?? []).map((subject) =>
          this.mapSubjectRow(subject),
        ),
      }))
      .sort((a, b) => a.year - b.year);
  }

  private toYearBlocksFromCards(
    groups: Array<{
      label: string;
      order: number;
      subjects: StudentSubjectCard[];
    }>,
  ): YearBlock[] {
    return groups.map((group) => ({
      year: Number.isFinite(group.order)
        ? group.order
        : Number.POSITIVE_INFINITY,
      label: group.label,
      subjects: group.subjects
        .map((card) => ({
          id: card.subjectId,
          name: card.subjectName,
          calendarYear: card.yearNumber,
          division: card.commissionLabel,
          finalCondition: card.condition ?? card.accreditation ?? null,
          lastExamSummary: card.finalExplanation ?? null,
          hasGrades: this.hasLegacyGrades(card),
        }))
        .map((subject) => this.mapSubjectRow(subject)),
    }));
  }

  private mapSubjectRow(subject: StudentSummarySubject): SubjectRow {
    const hasGrades = this.resolveHasGrades(subject);
    return {
      ...subject,
      hasGrades,
      courseLabel: this.buildCourseLabel(subject.calendarYear, subject.division),
      examsText: hasGrades
        ? subject.lastExamSummary ?? '-'
        : this.missingGradesText(),
    };
  }

  private buildLegacyYearGroups(): Array<{
    label: string;
    order: number;
    subjects: StudentSubjectCard[];
  }> {
    const map = new Map<
      string,
      { label: string; order: number; subjects: StudentSubjectCard[] }
    >();
    this.cards().forEach((card) => {
      const key = card.yearLabel;
      if (!map.has(key)) {
        map.set(key, {
          label: key,
          order: this.getYearOrder(card),
          subjects: [],
        });
      }
      map.get(key)!.subjects.push(card);
    });
    return Array.from(map.values()).map((group) => ({
      ...group,
      subjects: this.sortSubjects(group.subjects),
    }));
  }

  private sortSubjects(subjects: StudentSubjectCard[]): StudentSubjectCard[] {
    return [...subjects].sort((a, b) =>
      a.subjectName.localeCompare(b.subjectName),
    );
  }

  private getYearOrder(card: StudentSubjectCard): number {
    if (
      typeof card.yearNumber === 'number' &&
      Number.isFinite(card.yearNumber)
    ) {
      return card.yearNumber;
    }
    const match = card.yearLabel.match(/\d+/);
    if (match) {
      const numeric = Number(match[0]);
      if (Number.isFinite(numeric)) return numeric;
    }
    return Number.POSITIVE_INFINITY;
  }

  private yearLabel(year: number): string {
    if (!Number.isFinite(year) || year <= 0) return 'Sin año';
    return `${year}.º año`;
  }

  private formatRegisteredSince(value: string | null | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const day = `${date.getDate()}`.padStart(2, '0');
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
  }

  private academicYearText(value: number | null | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return '-';
    }
    return `${value}.º año`;
  }

  private buildCourseLabel(
    calendarYear: number | null,
    division: string | null,
  ): string {
    const yearPart =
      typeof calendarYear === 'number' && Number.isFinite(calendarYear)
        ? String(calendarYear)
        : null;
    if (yearPart && division) return `${yearPart} ${division}`;
    if (yearPart) return yearPart;
    if (division) return division;
    return '-';
  }

  private resolveHasGrades(subject: StudentSummarySubject): boolean {
    if (typeof subject.hasGrades === 'boolean') return subject.hasGrades;
    const hasSummary =
      typeof subject.lastExamSummary === 'string' &&
      subject.lastExamSummary.trim().length > 0 &&
      subject.lastExamSummary.trim() !== '(Insc.)';
    const hasCondition =
      typeof subject.finalCondition === 'string' &&
      subject.finalCondition.trim().length > 0;
    return hasSummary || hasCondition;
  }

  private hasLegacyGrades(card: StudentSubjectCard): boolean {
    const hasScore = typeof card.finalScore === 'number';
    const hasCondition =
      typeof card.condition === 'string' && card.condition.trim().length > 0;
    const hasAccreditation =
      typeof card.accreditation === 'string' &&
      card.accreditation.trim().length > 0;
    return hasScore || hasCondition || hasAccreditation;
  }

  private missingGradesText(): string {
    return 'Se requieren 4 parciales para calcular la nota final.';
  }

  private composeFullName(
    firstName?: string | null,
    lastName?: string | null,
  ): string | null {
    const parts = [firstName, lastName]
      .map((value) => (value ?? '').trim())
      .filter((value) => value.length);
    if (!parts.length) return null;
    return parts.join(' ');
  }

  private normalizeText(value?: string | null): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
}
