import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { forkJoin, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { TooltipModule } from 'primeng/tooltip';
import { GoBackService } from '../../../core/services/go_back.service';
import { SubjectsService } from '../../../core/services/subjects.service';
import {
  AcademicSituationApiResponse,
  AcademicSituationRow,
} from './subject-academic-situation.types';

@Component({
  selector: 'app-subject-academic-situation-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ProgressSpinnerModule,
    TooltipModule,
  ],
  templateUrl: './subject-academic-situation.page.html',
  styleUrl: './subject-academic-situation.page.scss',
  providers: [MessageService],
})
export class SubjectAcademicSituationPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly goBackSvc = inject(GoBackService);
  private readonly subjectsSvc = inject(SubjectsService);
  private readonly messages = inject(MessageService);

  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<AcademicSituationApiResponse | null>(null);

  readonly searchTerm = signal('');
  readonly selectedCommission = signal<number>(0);

  private filtersInitialized = false;
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;
  private currentFetch: Subscription | null = null;
  private currentPersist: Subscription | null = null;
  private clonedRows = new Map<string, AcademicSituationRow>();
  private readonly baselineSignal = signal<
    Record<string, AcademicSituationRow>
  >({});
  private readonly pendingSignal = signal<Record<string, PendingRowChanges>>(
    {}
  );
  readonly hasPendingChanges = computed(
    () => Object.keys(this.pendingSignal()).length > 0
  );
  readonly saving = signal(false);

  subjectId = Number(this.route.snapshot.paramMap.get('subjectId') ?? 0);
  subjectName = computed(() => this.data()?.subject.name ?? 'Materia');
  partials = computed(() => this.data()?.subject.partials ?? 2);
  rows = computed(() => this.data()?.rows ?? []);

  commissionOptions = computed(() => {
    const base = this.data()?.commissions ?? [];
    return [
      { id: 0, letter: 'Todas' as string | null },
      ...base.map((entry) => ({
        id: entry.id,
        letter: entry.letter ?? null,
      })),
    ];
  });

  commissionSelectItems = computed(() =>
    this.commissionOptions().map((option) => ({
      label: option.letter ?? `Comision ${option.id}`,
      value: option.id,
    }))
  );

  private readonly filtersEffect = effect(() => {
    const q = this.searchTerm();
    const commissionId = this.selectedCommission();
    if (!this.filtersInitialized) {
      this.filtersInitialized = true;
      return;
    }
    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle);
    }
    this.debounceHandle = setTimeout(() => {
      this.fetchAcademicSituation({
        q: q.trim() ? q.trim() : undefined,
        commissionId: commissionId > 0 ? commissionId : undefined,
      });
    }, 300);
  });

  ngOnInit(): void {
    this.fetchAcademicSituation();
  }

  ngOnDestroy(): void {
    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = null;
    }
    this.currentFetch?.unsubscribe();
    this.currentPersist?.unsubscribe();
    this.clonedRows.clear();
    this.filtersEffect.destroy();
  }

  back(): void {
    this.goBackSvc.back();
  }

  rowsTrackBy(_: number, item: AcademicSituationRow): string {
    return item.studentId;
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value ?? '');
  }

  onCommissionChange(value: number | null | undefined): void {
    this.selectedCommission.set(value ?? 0);
  }

  clearFilters(table?: Table): void {
    table?.reset();
    this.searchTerm.set('');
    this.selectedCommission.set(0);
  }

  onReload(): void {
    const q = this.searchTerm().trim();
    const commissionId = this.selectedCommission();
    this.currentPersist?.unsubscribe();
    this.currentPersist = null;
    this.saving.set(false);
    this.pendingSignal.set({});
    this.clonedRows.clear();
    this.fetchAcademicSituation({
      q: q ? q : undefined,
      commissionId: commissionId > 0 ? commissionId : undefined,
    });
  }

  onSaveChanges(): void {
    if (!this.hasPendingChanges() || this.saving()) {
      return;
    }

    const payloads = this.buildCommissionPayloads();
    if (!payloads.length) {
      return;
    }

    this.saving.set(true);
    this.currentPersist?.unsubscribe();

    const requests = payloads.map(({ commissionId, body, studentIds }) =>
      this.subjectsSvc
        .bulkUpsertCommissionGrades(commissionId, body)
        .pipe(map(() => studentIds))
    );

    this.currentPersist = forkJoin(requests).subscribe({
      next: (groups) => {
        this.saving.set(false);
        this.currentPersist = null;
        const savedIds = groups.flat();
        this.applySuccessfulPersist(savedIds);
        this.messages.add({
          severity: 'success',
          summary: 'Cambios guardados',
          detail: 'Las notas se guardaron correctamente.',
        });
      },
      error: () => {
        this.saving.set(false);
        this.currentPersist = null;
        this.showError(
          'Error al guardar',
          'No se pudieron guardar los cambios. Intenta nuevamente.'
        );
      },
    });
  }

  onRowEditInit(row: AcademicSituationRow): void {
    if (!row?.studentId) {
      return;
    }
    this.clonedRows.set(row.studentId, { ...row });
  }

  onRowEditSave(row: AcademicSituationRow): void {
    if (!row?.studentId) {
      return;
    }

    const fields = this.getEditableFields();

    for (const field of fields) {
      const parsed = this.parseGradeValue(row[field]);
      if (parsed === undefined) {
        const original = this.clonedRows.get(row.studentId);
        if (original) {
          this.syncRow(original);
          this.recalculatePendingForRow(original);
        }
        this.showError(
          'Valores invalidos',
          'Las notas deben estar entre 0 y 10 o vacías.'
        );
        return;
      }
    }

    const base = this.baselineRows()[row.studentId];

    this.clearPendingForStudent(row.studentId);

    for (const field of fields) {
      const parsed = this.parseGradeValue(row[field]);
      const normalized = parsed ?? null;
      row[field] = normalized;
      const baselineValue = base ? base[field] ?? null : null;
      this.updatePendingChanges(
        row.studentId,
        field,
        normalized,
        baselineValue
      );
    }

    this.syncRow(row);
    this.clonedRows.delete(row.studentId);
  }

  onRowEditCancel(row: AcademicSituationRow, index: number): void {
    if (!row?.studentId) {
      return;
    }

    const original = this.clonedRows.get(row.studentId);
    if (!original) {
      return;
    }

    const list = this.data()?.rows ?? [];
    if (list[index]?.studentId === row.studentId) {
      const updatedRows = [...list];
      updatedRows[index] = { ...original };
      this.data.update((snapshot) =>
        snapshot ? { ...snapshot, rows: updatedRows } : snapshot
      );
    } else {
      this.syncRow(original);
    }

    this.recalculatePendingForRow(original);
    this.clonedRows.delete(row.studentId);
  }

  finalClass(score: number | null): string {
    if (score === null || score === undefined) return '';
    if (this.isGradePromoted(score)) return 'nota-promocionada';
    if (this.isGradeApproved(score)) return 'nota-aprobada';
    if (this.isGradeDisapproved(score)) return 'nota-desaprobada';
    return '';
  }

  private fetchAcademicSituation(params?: {
    q?: string;
    commissionId?: number;
  }): void {
    this.loading.set(true);
    this.error.set(null);
    this.currentFetch?.unsubscribe();
    this.currentFetch = this.subjectsSvc
      .getSubjectAcademicSituation(this.subjectId, params)
      .subscribe({
        next: (payload) => {
          this.currentFetch = null;
          this.data.set(payload);
          this.setBaselineRows(payload.rows);
          this.pendingSignal.set({});
          this.clonedRows.clear();
          this.saving.set(false);
          this.loading.set(false);
        },
        error: () => {
          this.currentFetch = null;
          this.error.set('No se pudo cargar la situacion academica.');
          this.loading.set(false);
        },
      });
  }

  private syncRow(updated: AcademicSituationRow): void {
    const normalized: AcademicSituationRow = { ...updated };
    this.data.update((snapshot) => {
      if (!snapshot) {
        return snapshot;
      }
      const rows = snapshot.rows.map((row) =>
        row.studentId === normalized.studentId ? { ...row, ...normalized } : row
      );
      return { ...snapshot, rows };
    });
  }

  private setBaselineRows(rows: AcademicSituationRow[]): void {
    const baseline: Record<string, AcademicSituationRow> = {};
    for (const row of rows) {
      baseline[row.studentId] = { ...row };
    }
    this.baselineSignal.set(baseline);
  }

  private baselineRows(): Record<string, AcademicSituationRow> {
    return this.baselineSignal();
  }

  private buildCommissionPayloads(): CommissionPayload[] {
    const pending = this.pendingSignal();
    if (!Object.keys(pending).length) {
      return [];
    }
    const rows = this.data()?.rows ?? [];
    const rowMap = new Map(rows.map((row) => [row.studentId, row]));
    const byCommission = new Map<number, CommissionPayload>();

    for (const [studentId, changes] of Object.entries(pending)) {
      const row = rowMap.get(studentId);
      if (!row) {
        continue;
      }
      const payloadRow: CommissionPayloadRow = { studentId };
      for (const [field, value] of Object.entries(changes) as Array<
        [EditableField, number | null]
      >) {
        if (value === undefined) {
          continue;
        }
        payloadRow[field] = value ?? null;
      }
      if (Object.keys(payloadRow).length === 1) {
        continue;
      }
      const existing = byCommission.get(row.commissionId);
      if (existing) {
        existing.body.rows.push(payloadRow);
        existing.studentIds.push(studentId);
      } else {
        byCommission.set(row.commissionId, {
          commissionId: row.commissionId,
          body: { rows: [payloadRow] },
          studentIds: [studentId],
        });
      }
    }

    return Array.from(byCommission.values());
  }

  private applySuccessfulPersist(studentIds: string[]): void {
    if (!studentIds.length) {
      return;
    }
    const baseline = { ...this.baselineSignal() };
    const rows = this.data()?.rows ?? [];
    const rowMap = new Map(rows.map((row) => [row.studentId, row]));

    for (const id of studentIds) {
      const row = rowMap.get(id);
      if (row) {
        baseline[id] = { ...row };
      }
    }

    this.baselineSignal.set(baseline);
    this.pendingSignal.update((current) => {
      if (!Object.keys(current).length) {
        return current;
      }
      const next = { ...current };
      for (const id of studentIds) {
        delete next[id];
      }
      return next;
    });
  }

  private clearPendingForStudent(studentId: string): void {
    this.pendingSignal.update((current) => {
      if (!(studentId in current)) {
        return current;
      }
      const next = { ...current };
      delete next[studentId];
      return next;
    });
  }

  private updatePendingChanges(
    studentId: string,
    field: EditableField,
    value: number | null,
    baselineValue: number | null
  ): void {
    const normalizedValue = value ?? null;
    const normalizedBaseline = baselineValue ?? null;
    this.pendingSignal.update((current) => {
      const next = { ...current };
      if (normalizedValue === normalizedBaseline) {
        const existing = next[studentId];
        if (existing) {
          const remaining = { ...existing };
          delete remaining[field];
          if (Object.keys(remaining).length === 0) {
            delete next[studentId];
          } else {
            next[studentId] = remaining;
          }
        }
        return next;
      }
      const rowChanges = { ...(next[studentId] ?? {}) };
      rowChanges[field] = normalizedValue;
      next[studentId] = rowChanges;
      return next;
    });
  }

  private recalculatePendingForRow(row: AcademicSituationRow): void {
    if (!row?.studentId) {
      return;
    }
    const base = this.baselineRows()[row.studentId];
    this.clearPendingForStudent(row.studentId);
    const fields = this.getEditableFields();
    for (const field of fields) {
      const currentValue = row[field] ?? null;
      const baselineValue = base ? base[field] ?? null : null;
      this.updatePendingChanges(
        row.studentId,
        field,
        currentValue,
        baselineValue
      );
    }
  }

  private getEditableFields(): EditableField[] {
    return this.partials() === 4
      ? ['note1', 'note2', 'note3', 'note4', 'final']
      : ['note1', 'note2', 'final'];
  }

  private parseGradeValue(value: unknown): number | null | undefined {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < 0 || numeric > 10) {
      return undefined;
    }
    return numeric;
  }

  private isGradeApproved(score: number | null): boolean {
    return score !== null && score >= 4 && score < 7;
  }

  private isGradePromoted(score: number | null): boolean {
    return score !== null && score >= 7;
  }

  private isGradeDisapproved(score: number | null): boolean {
    return score !== null && score < 4;
  }

  private showError(summary: string, detail: string): void {
    this.messages.add({
      severity: 'error',
      summary,
      detail,
    });
  }
}

type EditableField = 'note1' | 'note2' | 'note3' | 'note4' | 'final';
type PendingRowChanges = Partial<Record<EditableField, number | null>>;
type CommissionPayloadRow = { studentId: string } & PendingRowChanges;
type CommissionPayload = {
  commissionId: number;
  body: { rows: CommissionPayloadRow[] };
  studentIds: string[];
};
