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
import { TableModule, Table, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { GoBackService } from '../../../core/services/go_back.service';
import { SubjectsService } from '../../../core/services/subjects.service';
import {
  ApiService,
  ToggleEnrollmentResponse,
} from '../../../core/services/api.service';
import { BlockedActionDirective } from '../../../shared/directives/blocked-action.directive';
import { Tag } from 'primeng/tag';
import { ROLE } from '../../../core/auth/roles';
import { RbacService } from '@/core/rbac/rbac.service';
import {
  AcademicSituationApiResponse,
  AcademicSituationRow,
  TeacherWindowState,
} from './subject-academic-situation.types';
import { SubjectMoveCommissionDialog } from './subject-move-commission.dialog';
import { CanAnyRoleDirective } from '@/shared/directives/can-any-role.directive';
import {
  computeFinalForRow as computeFinalForRowUtil,
  finalClass as finalClassUtil,
  parseAttendanceValue,
  parseGradeValue,
  rowsTrackBy as rowsTrackByFn,
} from './utils/academic-utils';
import { UiAlertAuditService } from '../../../core/services/ui-alert-audit.service';
import {
  AppBreadcrumbComponent,
  SimpleBreadcrumbItem,
} from '@/shared/components/breadcrumb/app-breadcrumb.component';
import {
  SubjectStateSeverity,
  resolveSubjectStateSeverity,
} from '@/shared/utils/subject-state.utils';
import { PermissionService } from '@/core/auth/permission.service';

@Component({
  selector: 'app-subject-academic-situation-page',
  standalone: true,
  imports: [
    CommonModule,
    AppBreadcrumbComponent,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ProgressSpinnerModule,
    DialogModule,
    TooltipModule,
    Tag,
    BlockedActionDirective,
    SubjectMoveCommissionDialog,
    CanAnyRoleDirective,
  ],
  templateUrl: './subject-academic-situation.page.html',
  styleUrl: './subject-academic-situation.page.scss',
})
export class SubjectAcademicSituationPage implements OnInit, OnDestroy {
  // =======================
  // Dependencias
  // =======================
  private readonly route = inject(ActivatedRoute);
  private readonly goBackSvc = inject(GoBackService);
  private readonly subjectsSvc = inject(SubjectsService);
  private readonly api = inject(ApiService);
  private readonly messages = inject(MessageService);
  private readonly rbac = inject(RbacService);
  private readonly permissions = inject(PermissionService);
  private readonly uiAlertAudit = inject(UiAlertAuditService);

  breadcrumbItems: SimpleBreadcrumbItem[] = [
    { label: 'Gestion de materias', routerLink: '/subjects' },
    { label: 'Listado de materias', routerLink: '/subjects' },
    { label: 'Situacion academica de la materia' },
  ];

  // =======================
  // Estado y señales
  // =======================
  loading = signal(true);
  error = signal<string | null>(null);
  data = signal<AcademicSituationApiResponse | null>(null);

  readonly searchTerm = signal('');
  readonly allRows = signal<AcademicSituationRow[]>([]);
  readonly virtualRows = signal<AcademicSituationRow[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly pageSize = 30;

  readonly selectedCommission = signal<number>(0);
  readonly selectedStudentYear = signal<number | null>(null);

  readonly originalRows = signal<AcademicSituationRow[]>([]);

  private filtersInitialized = false;
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;
  private currentFetch: Subscription | null = null;
  private clonedRows = new Map<string, AcademicSituationRow>();
  readonly enrollmentLoading = signal<string | null>(null);
  private readonly shortDateFormatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  subjectId = Number(this.route.snapshot.paramMap.get('subjectId') ?? 0);
  // =======================
  // Derivados (computed)
  // =======================
  subjectName = computed(() => this.data()?.subject.name ?? 'Materia');
  partials = computed(() => this.data()?.subject.partials ?? 2);
  rows = computed(() => this.allRows());
  studentYearOptions = computed(() => {
    const rows = this.originalRows();
    const years = new Set<number>();
    for (const row of rows as any[]) {
      const year = this.extractStudentYear(row);
      if (year != null) {
        years.add(year);
      }
    }
    return Array.from(years).sort((a, b) => a - b);
  });

  studentYearSelectItems = computed(() => {
    const items = this.studentYearOptions().map((year) => ({
      label: `${year}º año`,
      value: year,
    }));
    return [{ label: 'Todos los años', value: null }, ...items];
  });
  readonly rowsTrackBy = rowsTrackByFn;
  readonly finalClass = finalClassUtil;
  private readonly teacherBypassRoles = [
    ROLE.SECRETARY,
    ROLE.EXECUTIVE_SECRETARY,
  ];
  readonly teacherHasRestrictions = computed(
    () =>
      this.rbac.has(ROLE.TEACHER) && !this.rbac.hasAny(this.teacherBypassRoles),
  );
  readonly commissionWindows = computed(() => {
    const map = new Map<number, TeacherWindowState | null>();
    (this.data()?.commissions ?? []).forEach((commission) => {
      map.set(commission.id, commission.teacherWindow ?? null);
    });
    return map;
  });
  readonly teacherWindowCards = computed(() => {
    const base = this.data()?.commissions ?? [];
    return base.map((entry) => ({
      id: entry.id,
      label: entry.letter ?? `Comision ${entry.id}`,
      status: entry.teacherWindow?.status ?? 'open',
      closesAt: entry.teacherWindow?.closesAt ?? null,
    }));
  });
  readonly teacherWindowNotice = computed(() => {
    if (!this.teacherHasRestrictions()) {
      return null;
    }
    const closed = this.teacherWindowCards().filter(
      (card) => card.status === 'closed',
    );
    if (!closed.length) {
      return null;
    }
    return 'El plazo de edicion de notas esta cerrado para algunas comisiones. Para modificaciones adicionales debes contactar a Secretaria.';
  });

  deadlineDialog: {
    visible: boolean;
    commissionId: number | null;
    value: string | null;
  } = {
    visible: false,
    commissionId: null,
    value: null,
  };

  openDeadlineEditor(commissionId: number, currentDeadline: string | null) {
    this.deadlineDialog.visible = true;
    this.deadlineDialog.commissionId = commissionId;
    const base = currentDeadline ? new Date(currentDeadline) : new Date();
    this.deadlineDialog.value = this.formatDeadlineForInput(base);
  }

  closeDeadlineDialog() {
    this.deadlineDialog.visible = false;
    this.deadlineDialog.commissionId = null;
    this.deadlineDialog.value = null;
  }

  saveDeadline() {
    if (!this.deadlineDialog.commissionId || !this.deadlineDialog.value) {
      return;
    }

    const date = new Date(this.deadlineDialog.value);
    const payload = {
      deadline: date.toISOString(),
    };

    this.api
      .request(
        'PATCH',
        `subjects/commissions/${this.deadlineDialog.commissionId}/grade-window`,
        payload,
      )
      .subscribe({
        next: () => {
          this.closeDeadlineDialog();
          this.onReload();
          this.uiAlertAudit.add(this.messages, {
            severity: 'success',
            summary: 'Plazo actualizado',
          });
        },
        error: () => {
          this.uiAlertAudit.add(this.messages, {
            severity: 'error',
            summary: 'Error al actualizar el plazo',
            detail:
              'No se pudo actualizar el plazo de edición de notas. Intenta nuevamente o contacta a Secretaría.',
          });
        },
      });
  }

  private formatDeadlineForInput(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  canEditRow(row: AcademicSituationRow): boolean {
    return this.canEditCommission(row?.commissionId ?? null);
  }

  teacherWindowTooltip(row: AcademicSituationRow): string {
    if (this.canEditRow(row)) {
      return 'Editar notas/asistencia';
    }
    const state = this.commissionWindows().get(row.commissionId);
    const date =
      state?.closesAt && state.closesAt.length
        ? this.formatWindowDate(state.closesAt)
        : null;
    const when = date ? ` Cerró el ${date}.` : '';
    return `Plazo cerrado para docentes.${when} Gestioná el cambio con Secretaría.`;
  }

  private canEditCommission(commissionId: number | null | undefined): boolean {
    if (!this.teacherHasRestrictions()) {
      return true;
    }
    if (!commissionId) {
      return false;
    }
    const state = this.commissionWindows().get(commissionId);
    return !state || state.status === 'open';
  }

  private formatWindowDate(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : this.shortDateFormatter.format(parsed);
  }

  private showWindowClosedWarning(row?: AcademicSituationRow): void {
    this.uiAlertAudit.add(this.messages, {
      severity: 'warn',
      summary: 'Plazo cerrado',
      detail:
        'El plazo del docente para esta comisión ya está¡ cerrado. Contacta a Secretaría para registrar cambios.',
    });
  }

  readonly ROLE = ROLE;
  // Solo roles administrativos pueden mover alumnos: docente nunca
  readonly canMoveStudents = computed(() =>
    this.permissions.hasAnyRole([
      ROLE.PRECEPTOR,
      ROLE.SECRETARY,
      ROLE.EXECUTIVE_SECRETARY,
    ]),
  );

  conditionSeverity(
    condition: string | null | undefined,
  ): SubjectStateSeverity {
    return resolveSubjectStateSeverity(condition);
  }

  // Mover alumno de comision
  moveDialog = signal<{
    visible: boolean;
    loading: boolean;
    studentId: string | null;
    currentCommissionId: number | null;
  }>({
    visible: false,
    loading: false,
    studentId: null,
    currentCommissionId: null,
  });

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

  // Opciones para el diálogo de mover alumno (sin la opción "Todas")
  moveCommissionOptions = computed(() => {
    const base = this.data()?.commissions ?? [];
    return base.map((entry) => ({
      id: entry.id,
      letter: entry.letter ?? null,
    }));
  });

  commissionSelectItems = computed(() =>
    this.commissionOptions().map((option) => {
      if (option.id === 0) {
        return { label: option.letter ?? 'Todas', value: option.id };
      }
      const window = this.commissionWindows().get(option.id);
      const suffix = window?.status === 'closed' ? '· Plazo cerrado' : '';
      return {
        label: `${option.letter ?? `Comision ${option.id}`}${suffix}`,
        value: option.id,
      };
    }),
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

  private readonly studentYearFilterEffect = effect(() => {
    const selected = this.selectedStudentYear();
    const base = this.originalRows();

    if (!base || base.length === 0) return;
    if (this.loading()) return;

    this.applyStudentYearFilter();
  });

  // =======================
  // Efectos (effects) y ciclo de vida
  // =======================
  ngOnInit(): void {
    this.fetchAcademicSituation();
  }

  ngOnDestroy(): void {
    if (this.debounceHandle) {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = null;
    }
    this.currentFetch?.unsubscribe();
    this.clonedRows.clear();
    this.filtersEffect.destroy();
    this.studentYearFilterEffect.destroy();
  }

  // =======================
  // Handlers de UI (clicks, ediciones, inscripción)
  // =======================
  back(): void {
    this.goBackSvc.back();
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
    this.selectedStudentYear.set(null);
  }

  onReload(): void {
    const q = this.searchTerm().trim();
    const commissionId = this.selectedCommission();
    this.clonedRows.clear();
    this.fetchAcademicSituation({
      q: q ? q : undefined,
      commissionId: commissionId > 0 ? commissionId : undefined,
    });
  }

  onStudentYearChange(value: number | null | undefined): void {
    if (value === null || value === undefined) {
      this.selectedStudentYear.set(null);
      return;
    }
    const numeric = Number(value);
    this.selectedStudentYear.set(
      Number.isFinite(numeric) && numeric > 0 ? numeric : null,
    );
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const all = this.allRows();
    if (!all.length) {
      return;
    }
    const first = event.first ?? 0;
    const rows = event.rows ?? this.pageSize;
    const end = Math.min(first + rows, all.length);
    const virtual = [...this.virtualRows()];
    if (virtual.length < all.length) {
      virtual.length = all.length;
    }
    for (let index = first; index < end; index += 1) {
      virtual[index] = all[index];
    }
    this.virtualRows.set(virtual as AcademicSituationRow[]);
  }

  onRowEditInit(row: AcademicSituationRow): void {
    if (!row?.studentId) {
      return;
    }
    if (!this.canEditRow(row)) {
      this.showWindowClosedWarning(row);
      return;
    }
    this.clonedRows.set(row.studentId, { ...row });
  }

  onRowEditSave(row: AcademicSituationRow): void {
    if (!row?.studentId) {
      return;
    }
    if (!row?.commissionId) {
      this.showError('Error', 'La fila no tiene una comision asociada.');
      this.restoreRowFromClone(row.studentId);

      return;
    }
    if (!this.canEditRow(row)) {
      this.showWindowClosedWarning(row);
      this.restoreRowFromClone(row.studentId);

      return;
    }

    const fields = this.getEditableFields();

    for (const field of fields) {
      const parsed =
        field === 'attendancePercentage'
          ? parseAttendanceValue(row[field])
          : parseGradeValue(row[field]);
      if (parsed === undefined) {
        this.restoreRowFromClone(row.studentId);
        this.showError(
          'Valores invalidos',
          'Las notas deben estar entre 0 y 10 (o asistencia entre 0 y 100) o vacias.',
        );
        return;
      }
    }

    for (const field of fields) {
      const parsed =
        field === 'attendancePercentage'
          ? parseAttendanceValue(row[field])
          : parseGradeValue(row[field]);
      const normalized =
        field === 'attendancePercentage' ? (parsed ?? 0) : (parsed ?? null);
      if (field === 'attendancePercentage') {
        row.attendancePercentage = normalized as number;
      } else {
        (row as any)[field] = normalized;
      }
    }

    row.final = computeFinalForRowUtil(row, this.partials());

    this.syncRow(row);

    const payload = {
      rows: [this.buildSingleRowPayload(row)],
    };

    this.subjectsSvc
      .bulkUpsertCommissionGrades(row.commissionId, payload)
      .subscribe({
        next: () => {
          this.clonedRows.delete(row.studentId);
          this.uiAlertAudit.add(this.messages, {
            severity: 'success',
            summary: 'Cambios guardados',
            detail: `Se guardaron los cambios para ${row.fullName}.`,
          });
          this.onReload();
        },
        error: () => {
          this.restoreRowFromClone(row.studentId);
          this.showError(
            'Error al guardar',
            'No se pudieron guardar los cambios de esta fila. Intenta nuevamente.',
          );
        },
      });
  }
  onRowEditCancel(row: AcademicSituationRow, index: number): void {
    if (!row?.studentId) {
      return;
    }

    const original = this.clonedRows.get(row.studentId);
    if (!original) {
      return;
    }

    this.syncRow(original);
    this.clonedRows.delete(row.studentId);
  }

  // =======================
  // Llamadas a API / Persistencia
  // =======================
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
          const partialsCount = payload.subject.partials;
          const rowsWithComputedFinal = (payload.rows ?? []).map((row) => {
            const computedFinal = computeFinalForRowUtil(row, partialsCount);
            const enrolled = !!(row as any).enrolled;
            return { ...row, final: computedFinal, enrolled };
          });

          this.data.set({ ...payload, rows: rowsWithComputedFinal });
          const all = rowsWithComputedFinal;
          this.originalRows.set(all);
          this.applyStudentYearFilter();
          this.clonedRows.clear();
          this.loading.set(false);
        },
        error: () => {
          this.currentFetch = null;
          this.error.set('No se pudo cargar la situacion academica.');
          this.loading.set(false);
        },
      });
  }

  // =======================
  // Utilidades internas
  // =======================
  private applyStudentYearFilter(): void {
    const base = this.originalRows();
    const selected = this.selectedStudentYear();
    const filtered = this.filterRowsByYear(base, selected);

    this.allRows.set(filtered);
    this.totalRecords.set(filtered.length);

    const placeholders = Array.from({
      length: filtered.length,
    }) as AcademicSituationRow[];
    this.virtualRows.set(placeholders);
    this.onLazyLoad({ first: 0, rows: this.pageSize });
  }

  private filterRowsByYear(
    rows: AcademicSituationRow[],
    selectedYear: number | null,
  ): AcademicSituationRow[] {
    if (selectedYear == null) {
      return [...rows];
    }
    return rows.filter(
      (row) => this.extractStudentYear(row) === selectedYear,
    );
  }

  private extractStudentYear(row: AcademicSituationRow | any): number | null {
    const candidate =
      row?.student_year ??
      row?.studentYear ??
      row?.year ??
      row?.yearNo ??
      row?.year_number ??
      null;

    const numeric = Number(candidate);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  /** Reemplaza una fila por studentId en el array de la tabla (inmutable). */
  private replaceRowInTable(updated: AcademicSituationRow): void {
    const normalized = { ...updated };
    this.data.update((snapshot) => {
      if (!snapshot) return snapshot;
      const nextRows = snapshot.rows.map((row) =>
        row.studentId === normalized.studentId
          ? { ...row, ...normalized }
          : row,
      );
      return { ...snapshot, rows: nextRows };
    });
    this.originalRows.update((rows) =>
      rows.map((row) =>
        row.studentId === normalized.studentId
          ? { ...row, ...normalized }
          : row,
      ),
    );
    this.allRows.update((rows) =>
      rows.map((row) =>
        row.studentId === normalized.studentId
          ? { ...row, ...normalized }
          : row,
      ),
    );
    this.virtualRows.update((rows) =>
      rows.map((row) => {
        if (!row) {
          return row;
        }
        return row.studentId === normalized.studentId
          ? { ...row, ...normalized }
          : row;
      }),
    );
  }

  /** Sincroniza una fila en memoria (uso general, no-optimista). */
  private syncRow(updated: AcademicSituationRow): void {
    this.replaceRowInTable(updated);
  }

  private restoreRowFromClone(studentId: string): void {
    if (!studentId) {
      return;
    }
    const original = this.clonedRows.get(studentId);
    if (!original) {
      return;
    }
    this.syncRow(original);
  }

  private buildSingleRowPayload(
    row: AcademicSituationRow,
  ): CommissionPayloadRow {
    const payload: CommissionPayloadRow = {
      studentId: row.studentId,
      note1: row.note1 ?? null,
      note2: row.note2 ?? null,
      percentage: row.attendancePercentage ?? 0,
      final: row.final ?? null,
    };

    if (this.partials() === 4) {
      payload.note3 = row.note3 ?? null;
      payload.note4 = row.note4 ?? null;
    }

    return payload;
  }

  private getEditableFields(): EditableField[] {
    const gradeFields: EditableField[] =
      this.partials() === 4
        ? ['note1', 'note2', 'note3', 'note4']
        : ['note1', 'note2'];
    // también hacemos editable la asistencia
    return [...gradeFields, 'attendancePercentage'];
  }

  private showError(summary: string, detail: string): void {
    this.uiAlertAudit.add(this.messages, {
      severity: 'error',
      summary,
      detail,
    });
  }

  onToggleSubjectEnrollment(
    row: AcademicSituationRow,

    action: 'enroll' | 'unenroll',
  ) {
    if (!row?.commissionId) {
      this.showError('Error', 'La fila no tiene una comisiï¿½n asociada.');

      return;
    }

    const prev = { ...row };

    const optimisticEnrolled = action === 'enroll';

    const optimisticRow: AcademicSituationRow = {
      ...row,

      enrolled: optimisticEnrolled,
    };

    this.enrollmentLoading.set(row.studentId);

    row.enrolled = optimisticEnrolled;

    this.replaceRowInTable(optimisticRow);

    this.api

      .toggleSubjectEnrollment({
        subjectCommissionId: row.commissionId,

        studentId: row.studentId,

        action,
      })

      .subscribe({
        next: (res: ToggleEnrollmentResponse) => {
          const serverEnrolled = !!res?.enrolled;

          const confirmedRow: AcademicSituationRow = {
            ...optimisticRow,

            enrolled: serverEnrolled,

            condition:
              res?.condition ??
              optimisticRow.condition ??
              (serverEnrolled
                ? (optimisticRow.condition ?? null)
                : 'No inscripto'),
          };

          row.enrolled = serverEnrolled;

          this.replaceRowInTable(confirmedRow);

          const actorLabel = res?.enrolled_by ?? 'ï¿½';

          const dateLabel = res?.enrolled_at
            ? new Date(res.enrolled_at).toLocaleString()
            : '';

          const detail = serverEnrolled
            ? `Por ${actorLabel}${dateLabel ? ` el ${dateLabel}` : ''}`
            : 'Se removiï¿½ la inscripciï¿½n en la comisiï¿½n.';

          this.uiAlertAudit.add(this.messages, {
            severity: 'success',

            summary: serverEnrolled
              ? 'Alumno inscripto'
              : 'Alumno desinscripto',

            detail,
          });
        },

        error: () => {
          Object.assign(row, prev);

          this.replaceRowInTable(prev);

          this.showError('Error', 'No se pudo actualizar la inscripciï¿½n.');
        },

        complete: () => this.enrollmentLoading.set(null),
      });
  }

  openMoveCommission(row: AcademicSituationRow) {
    if (!this.canMoveStudents()) return;
    this.moveDialog.set({
      visible: true,
      loading: false,
      studentId: row.studentId,
      currentCommissionId: row.commissionId,
    });
  }

  closeMoveDialog() {
    this.moveDialog.set({
      visible: false,
      loading: false,
      studentId: null,
      currentCommissionId: null,
    });
  }

  confirmMoveCommission(newCommissionId: number | null) {
    const d = this.moveDialog();
    if (
      !d.studentId ||
      !newCommissionId ||
      newCommissionId === d.currentCommissionId
    )
      return;
    this.moveDialog.update((v) => ({ ...v, loading: true }));
    this.subjectsSvc
      .moveStudentCommission(this.subjectId, d.studentId, newCommissionId)
      .subscribe({
        next: () => {
          this.moveDialog.update((v) => ({ ...v, loading: false }));
          this.closeMoveDialog();
          // refrescar situación académica
          this.onReload();
          this.uiAlertAudit.add(this.messages, {
            severity: 'success',
            summary: 'Alumno movido',
            detail: 'La comision del alumno fue actualizada.',
          });
        },
        error: (err: unknown) => {
          console.error('Error moviendo alumno', err);
          this.moveDialog.update((v) => ({ ...v, loading: false }));
          this.showError('Error', 'No se pudo mover el alumno de comision.');
        },
      });
  }
}

type EditableField =
  | 'note1'
  | 'note2'
  | 'note3'
  | 'note4'
  | 'attendancePercentage';
type CommissionPayloadRow = {
  studentId: string;
  note1: number | null;
  note2: number | null;
  note3?: number | null;
  note4?: number | null;
  percentage: number;
  final: number | null;
};
