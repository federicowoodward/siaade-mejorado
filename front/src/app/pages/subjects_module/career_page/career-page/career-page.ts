import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';
import { CareerCatalogService } from '../../../../core/services/career-catalog.service';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UiAlertAuditService } from '../../../../core/services/ui-alert-audit.service';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';

type SubjectView = {
  id: number;
  subjectName: string;
  orderNo: number;
  prerequisites: number[];
};

@Component({
  selector: 'app-career-page',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    FormsModule,
    TableModule,
    CardModule,
    ProgressSpinnerModule,
    ButtonModule,
    RouterLink,
    DividerModule,
    DialogModule,
    MultiSelectModule,
    ToastModule,
  ],
  templateUrl: './career-page.html',
  styleUrls: ['./career-page.scss'],
})
export class CareerPage implements OnInit {
  private catalog = inject(CareerCatalogService);
  private router = inject(Router);
  private messages = inject(MessageService);
  private uiAlertAudit = inject(UiAlertAuditService);

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Gestión de materias', routerLink: '/subjects' },
    { label: 'Información de la carrera' },
  ];

  private readonly careerId = 1;
  loading = signal(true);
  error = signal<string | null>(null);
  dialogVisible = signal(false);
  dialogSaving = signal(false);
  selectedSubject = signal<SubjectView | null>(null);
  dialogPrereqs = signal<number[]>([]);

  data = computed(() => ({
    career: this.catalog.career(),
    preceptor: this.catalog.preceptor(),
    academicPeriods: this.catalog.periods(),
  }));

  periodsByYear = computed(() => {
    const periods = this.data().academicPeriods ?? [];

    type PeriodEntry = {
      academicPeriod:
        | { id: number; name: string; partialsScoreNeeded: number }
        | null;
      subjects: any[];
    };

    type YearGroup = {
      yearIndex: number | null;
      label: string;
      annual: PeriodEntry | null;
      firstSemester: PeriodEntry | null;
      secondSemester: PeriodEntry | null;
      others: PeriodEntry[];
    };

    const map = new Map<number | 'no_year', YearGroup>();

    const getGroup = (yearIndex: number | null): YearGroup => {
      const key = yearIndex ?? 'no_year';
      const existing = map.get(key);
      if (existing) return existing;
      const group: YearGroup = {
        yearIndex,
        label:
          yearIndex != null && Number.isFinite(yearIndex)
            ? `${yearIndex}º año`
            : 'Sin año',
        annual: null,
        firstSemester: null,
        secondSemester: null,
        others: [],
      };
      map.set(key, group);
      return group;
    };

    for (const period of periods as any[]) {
      const subjects = period?.subjects ?? [];
      const firstWithOrdering = subjects.find(
        (s: any) => s?.careerOrdering && s.careerOrdering.periodOrder != null,
      );

      const periodOrder: number | null =
        firstWithOrdering?.careerOrdering?.periodOrder ?? null;

      const yearIndex: number | null =
        periodOrder != null ? Math.floor(periodOrder / 3) + 1 : null;

      const group = getGroup(yearIndex);

      const entry: PeriodEntry = {
        academicPeriod: period.academicPeriod ?? null,
        subjects,
      };

      if (periodOrder == null) {
        group.others.push(entry);
        continue;
      }

      const mod = ((periodOrder % 3) + 3) % 3;
      if (mod === 0) {
        if (!group.annual) group.annual = entry;
        else group.others.push(entry);
      } else if (mod === 1) {
        if (!group.firstSemester) group.firstSemester = entry;
        else group.others.push(entry);
      } else {
        if (!group.secondSemester) group.secondSemester = entry;
        else group.others.push(entry);
      }
    }

    const result = Array.from(map.values());
    result.sort((a, b) => {
      if (a.yearIndex == null && b.yearIndex == null) return 0;
      if (a.yearIndex == null) return 1;
      if (b.yearIndex == null) return -1;
      return a.yearIndex - b.yearIndex;
    });

    return result;
  });

  private subjectsFlat = computed<SubjectView[]>(() => {
    const periods = this.data().academicPeriods ?? [];
    return periods.flatMap((period: any) =>
      (period?.subjects ?? []).map((subject: any) => ({
        id: subject.id,
        subjectName: subject.subjectName,
        orderNo: subject.careerOrdering?.orderNo ?? 0,
        prerequisites: subject.prerequisites ?? [],
      })),
    );
  });

  prereqOptions = computed(() => {
    const subject = this.selectedSubject();
    if (!subject) return [];
    return this.subjectsFlat()
      .filter((s) => s.orderNo < subject.orderNo)
      .map((s) => ({
        label: `${s.orderNo} º ${s.subjectName}`,
        value: s.orderNo,
      }));
  });

  ngOnInit(): void {
    this.fetchCareer();
  }

  goBack() {
    this.router.navigate(['/subjects']);
  }

  openPrereqDialog(subject: any) {
    if (!subject) return;
    const draft: SubjectView = {
      id: subject.id,
      subjectName: subject.subjectName,
      orderNo: subject.careerOrdering?.orderNo ?? 0,
      prerequisites: [...(subject.prerequisites ?? [])],
    };
    this.selectedSubject.set(draft);
    this.dialogPrereqs.set([...draft.prerequisites]);
    this.dialogVisible.set(true);
  }

  closeDialog() {
    this.dialogVisible.set(false);
    this.dialogSaving.set(false);
    this.selectedSubject.set(null);
    this.dialogPrereqs.set([]);
  }

  onDialogVisibleChange(state: boolean) {
    if (state) {
      this.dialogVisible.set(true);
      return;
    }
    this.closeDialog();
  }

  get dialogPrereqsModel(): number[] {
    return this.dialogPrereqs();
  }

  set dialogPrereqsModel(value: number[]) {
    this.dialogPrereqs.set(value ?? []);
  }

  savePrereqs() {
    const subject = this.selectedSubject();
    if (!subject || this.dialogSaving()) return;
    this.dialogSaving.set(true);
    const payload = [...this.dialogPrereqs()].map((n) => Number(n));
    this.catalog
      .updateSubjectPrereqs(this.careerId, subject.orderNo, payload)
      .subscribe({
        next: () => {
          this.uiAlertAudit.add(this.messages, {
            severity: 'success',
            summary: 'Correlativas actualizadas',
            detail: subject.subjectName,
          });
          this.dialogSaving.set(false);
          this.closeDialog();
          this.fetchCareer({ force: true });
        },
        error: (err) => {
          console.error('Error guardando correlativas', err);
          const detail =
            err?.error?.message ??
            'No se pudieron guardar las correlativas. Intente nuevamente.';
          this.uiAlertAudit.add(this.messages, {
            severity: 'error',
            summary: 'Error',
            detail: Array.isArray(detail) ? detail.join(' | ') : detail,
          });
          this.dialogSaving.set(false);
        },
      });
  }

  private fetchCareer(options?: { force?: boolean }) {
    this.loading.set(true);
    this.error.set(null);
    this.catalog.loadCareer(this.careerId, options).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        console.error(err);
        this.error.set('No se pudo cargar la carrera.');
        this.loading.set(false);
      },
    });
  }
}

