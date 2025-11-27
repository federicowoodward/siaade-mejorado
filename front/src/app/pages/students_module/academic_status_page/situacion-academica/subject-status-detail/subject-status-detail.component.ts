import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  StudentStatusService,
  StudentSubjectCard,
  StudentSummarySubject,
} from '@/core/services/student-status.service';
import { GoBackService } from '@/core/services/go_back.service';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';
import {
  SubjectStateSeverity,
  resolveSubjectStateSeverity,
} from '@/shared/utils/subject-state.utils';

@Component({
  selector: 'app-subject-status-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    RouterModule,
    AppBreadcrumbComponent,
  ],
  templateUrl: './subject-status-detail.component.html',
  styleUrl: './subject-status-detail.component.scss',
})
export class SubjectStatusDetailComponent implements OnInit {
  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Situación académica', routerLink: '/alumno/situacion-academica' },
    { label: 'Detalle de materia' },
  ];

  private readonly route = inject(ActivatedRoute);
  private readonly statusService = inject(StudentStatusService);
  private readonly backService = inject(GoBackService);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  private readonly subjectId = signal<number | null>(null);
  private readonly subjectCard = signal<StudentSubjectCard | null>(null);
  private readonly subjectSummary = signal<StudentSummarySubject | null>(null);

  readonly summary = this.statusService.summary;

  readonly viewModel = computed(() => {
    const card = this.subjectCard();
    const summary = this.subjectSummary();
    const globalSummary = this.summary();

    if (!card && !summary) return null;

    const fullName =
      globalSummary?.fullName ??
      this.composeFullName(globalSummary?.firstName, globalSummary?.lastName);

    return {
      studentName: fullName || 'Alumno',
      academicYear:
        summary?.calendarYear ?? globalSummary?.currentAcademicYear ?? null,
      careerName: globalSummary?.careerPlanName ?? globalSummary?.planName,
      subjectName:
        card?.subjectName ?? summary?.name ?? 'Unidad Curricular sin nombre',
      condition: card?.condition ?? summary?.finalCondition ?? null,
      partials: card
        ? this.buildPartialsString(card)
        : this.derivePartialsFromSummary(summary),
      attendancePct:
        card?.attendancePct ??
        summary?.attendancePct ??
        this.deriveAttendanceFromSummary(summary),
    };
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('subjectId');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      this.navigateBack();
      return;
    }

    this.subjectId.set(id);
    this.loading.set(true);
    this.error.set(null);

    this.statusService.loadStatus().subscribe({
      next: () => {
        this.resolveSubjectData();
        this.loading.set(false);
        if (!this.viewModel()) {
          this.error.set(
            'No se encontró información para la materia seleccionada.',
          );
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar la información.');
      },
    });
  }

  stateSeverity(
    condition: string | null | undefined,
  ): SubjectStateSeverity {
    // Wrapper para reutilizar la lógica compartida de severidad de estado.
    return resolveSubjectStateSeverity(condition);
  }

  back(): void {
    this.navigateBack();
  }

  private resolveSubjectData(): void {
    const id = this.subjectId();
    if (!id) return;

    const cards = this.statusService.status();
    const foundCard: StudentSubjectCard | undefined =
      cards.find((c: StudentSubjectCard) => c.subjectId === id) ??
      cards.find((c: StudentSubjectCard) => c.subjectId === Number(id));

    this.subjectCard.set(foundCard ?? null);

    const summary = this.summary();
    const summarySubject: StudentSummarySubject | null =
      summary?.years
        ?.flatMap((year) => year.subjects as StudentSummarySubject[])
        .find((s: StudentSummarySubject) => s.id === id) ?? null;

    this.subjectSummary.set(summarySubject ?? null);
  }

  private buildPartialsString(card: StudentSubjectCard): string | null {
    const values = card.notes
      .map((note: { value: number | null }) => note.value)
      .filter(
        (value: number | null): value is number => typeof value === 'number',
      );
    if (!values.length) return null;
    return values.join(' - ');
  }

  private derivePartialsFromSummary(
    summary: StudentSummarySubject | null,
  ): string | null {
    if (!summary?.lastExamSummary) return null;
    const text = summary.lastExamSummary;
    const label = 'Parciales:';
    const idx = text.indexOf(label);
    if (idx === -1) return null;

    const after = text.slice(idx + label.length);
    const match = after.match(/([\d,\s]+)/);
    if (!match || !match[1]) return null;

    const raw = match[1].trim();
    if (!raw.length) return null;

    return raw.replace(/,\s*/g, ' - ');
  }

  private deriveAttendanceFromSummary(
    summary: StudentSummarySubject | null,
  ): number | null {
    if (!summary?.lastExamSummary) return null;
    const text = summary.lastExamSummary;
    const label = 'Asist.:';
    const idx = text.indexOf(label);
    if (idx === -1) return null;

    const after = text.slice(idx + label.length);
    const match = after.match(/(\d+(\.\d+)?)/);
    if (!match || !match[1]) return null;

    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
  }

  private composeFullName(
    firstName: string | null | undefined,
    lastName: string | null | undefined,
  ): string | null {
    const parts = [(firstName ?? '').trim(), (lastName ?? '').trim()].filter(
      (value) => value.length > 0,
    );
    return parts.length ? parts.join(' ') : null;
  }
  private navigateBack(): void {
    this.backService.back();
  }
}
