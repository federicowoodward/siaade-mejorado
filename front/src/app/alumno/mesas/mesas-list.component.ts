import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import type { ButtonSeverity } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  StudentExamBlockReason,
  StudentExamCall,
  StudentExamTable,
  StudentWindowState,
} from '../../core/models/student-exam.model';
import { StudentInscriptionsService } from '../../core/services/student-inscriptions.service';
import {
  BlockMessageComponent,
  BlockMessageVariant,
  BlockMessageAction,
} from '../../shared/block-message/block-message.component';
import { AuthService } from '../../core/services/auth.service';
import { ROLE } from '../../core/auth/roles';
import { ExamTableSyncService } from '../../core/services/exam-table-sync.service';
import {
  StudentStatusService,
  StudentSubjectCard,
} from '../../core/services/student-status.service';

interface ExamCallRow {
  mesaId: number;
  callId: number;
  subjectId: number;
  subjectName: string;
  commissionLabel: string | null;
  call: StudentExamCall;
  windowState: StudentWindowState;
  windowRange: string;
  quotaText: string;
  table: StudentExamTable;
}

type WindowFilter = StudentWindowState | 'all';

interface CourseCardViewModel {
  subjectId: number;
  subjectName: string;
  commissionLabel: string | null;
  notes: { label: string; value: number | null }[];
  attendancePct: number;
  finalScore: number | null;
  accreditation: string;
  condition: string | null;
  statusLabel: string;
  statusSeverity: ButtonSeverity;
  showEnrollCta: boolean;
  isEnrolled: boolean;
  raw: StudentSubjectCard;
}

const BLOCK_COPY: Record<
  StudentExamBlockReason | 'DEFAULT',
  { title: string; variant: BlockMessageVariant; message: string }
> = {
  WINDOW_CLOSED: {
    title: 'Ventana cerrada',
    variant: 'institutional',
    message:
      'Esta mesa se encuentra fuera del periodo habilitado. Verifica las fechas publicadas por Secretaria.',
  },
  MISSING_REQUIREMENTS: {
    title: 'Requisito academico pendiente',
    variant: 'official',
    message:
      'Tu plan indica que debes cumplir con los requisitos academicos antes de inscribirte. Regulariza la cursada o presenta la documentacion correspondiente.',
  },
  DUPLICATE: {
    title: 'Ya estas inscripto',
    variant: 'official',
    message:
      'No es posible duplicar inscripciones para el mismo llamado durante el mismo ano academico.',
  },
  QUOTA_FULL: {
    title: 'Cupo completo',
    variant: 'institutional',
    message:
      'El cupo disponible para esta mesa ya fue alcanzado segun la normativa institucional.',
  },
  BACKEND_BLOCK: {
    title: 'Bloqueado por el sistema',
    variant: 'official',
    message:
      'La mesa fue bloqueada por el area academica. Consulta con Secretaria para mas informacion.',
  },
  UNKNOWN: {
    title: 'No se pudo procesar la accion',
    variant: 'info',
    message:
      'Ocurrio un inconveniente al validar la inscripcion. Intenta nuevamente mas tarde.',
  },
  DEFAULT: {
    title: 'Accion bloqueada',
    variant: 'info',
    message:
      'El sistema bloqueo la accion. Volve a intentarlo o contacta a Secretaria.',
  },
};

@Component({
  selector: 'app-mesas-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    SelectModule,
    DatePickerModule,
    ButtonModule,
    DialogModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ProgressSpinnerModule,
    BlockMessageComponent,
  ],
  templateUrl: './mesas-list.component.html',
  styleUrl: './mesas-list.component.scss',
  providers: [MessageService],
})
export class MesasListComponent implements OnInit {
  private readonly inscriptions = inject(StudentInscriptionsService);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sync = inject(ExamTableSyncService);
  private readonly documentRef = inject(DOCUMENT, { optional: true });
  private readonly studentStatus = inject(StudentStatusService);

  readonly tables = this.inscriptions.tables;
  readonly loading = this.inscriptions.loading;
  readonly courseLoading = this.studentStatus.loading;

  private readonly studentSubjects = this.studentStatus.status;
  private readonly courseEnrollmentsOptimistic = signal<Set<number>>(new Set());

  readonly courseCardsVm = computed<CourseCardViewModel[]>(() => {
    const optimistic = this.courseEnrollmentsOptimistic();
    const tables = this.tables();
    const subjectIds = new Set<number>(tables.map((table) => table.subjectId));
    const subjects = this.studentSubjects();
    const source =
      subjectIds.size > 0
        ? subjects.filter((card) => subjectIds.has(card.subjectId))
        : subjects;
    return source
      .map((card) => this.mapCourseCard(card, optimistic))
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  });

  readonly subjectOptions = computed(() => {
    const seen = new Map<number, string>();
    this.tables().forEach((table) => {
      const id = table.subjectId;
      if (!seen.has(id)) {
        seen.set(id, table.subjectName);
      }
    });
    return Array.from(seen.entries()).map(([value, label]) => ({
      label,
      value,
    }));
  });

  readonly rows = computed(() => this.flattenRows(this.tables()));

  filters: {
    subjectId: number | null;
    dateRange: Date[] | null;
    windowState: WindowFilter;
  } = {
    subjectId: null,
    dateRange: null,
    windowState: 'open',
  };

  dialogVisible = false;
  selectedRow: ExamCallRow | null = null;
  private lastActionTrigger: HTMLElement | null = null;
  // Marca local optimista para evitar re-inscripciones mientras llega el refresh
  private enrolledLocal = new Set<number>();
  private get enrolledStorageKey() {
    return 'mesas_enrolled_calls';
  }
  isStudent = false;
  readonly blockAlert = signal<{
    title: string;
    message: string | string[];
    variant: BlockMessageVariant;
    reasonCode: StudentExamBlockReason | string;
  } | null>(null);

  readonly defaultBlockActions: BlockMessageAction[] = [
    {
      label: 'Ver situacion academica',
      icon: 'pi pi-book',
      command: () => this.navigateToStatus(),
    },
    {
      label: 'Actualizar mesas',
      icon: 'pi pi-refresh',
      command: () => this.loadTables(true),
    },
  ];

  ngOnInit(): void {
    const subjectId = Number(
      this.route.snapshot.queryParamMap.get('subjectId') ?? NaN,
    );
    if (Number.isFinite(subjectId)) {
      this.filters.subjectId = subjectId;
    }
    // Rol actual
    this.auth
      .getUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((u) => {
        this.isStudent = (u?.role ?? null) === ROLE.STUDENT;
      });
    // Cargar estado optimista persistido para esta sesión
    try {
      const raw = sessionStorage.getItem(this.enrolledStorageKey);
      if (raw) {
        const arr = JSON.parse(raw) as number[];
        if (Array.isArray(arr))
          arr.forEach((id) => this.enrolledLocal.add(Number(id)));
      }
    } catch {}
    const needsForce = this.sync.consumePendingFlag();
    if (needsForce) {
      this.inscriptions.invalidateCache();
    }
    // Forzar refresh inicial para asegurar consistencia después de reload
    // Esto evita mostrar datos stale cuando el preceptor inscribió desde otra pestaña
    this.loadTables(true);
    this.loadStudentSubjects();
    this.observeSyncEvents();
    this.setupVisibilityRefresh();
  }

  loadTables(force = false): void {
    this.inscriptions
      .listExamTables(this.buildFilterPayload(), { refresh: force })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  applyFilters(): void {
    this.loadTables();
  }

  clearFilters(): void {
    this.filters = {
      subjectId: null,
      dateRange: null,
      windowState: 'all',
    };
    this.loadTables();
  }

  onSubjectFilterChange(value: number | null): void {
    this.filters.subjectId = value;
  }

  onDateFilterChange(value: Date[] | null): void {
    this.filters.dateRange = value;
  }

  onWindowFilterChange(value: WindowFilter): void {
    this.filters.windowState = value;
  }

  reloadCourseStatus(): void {
    this.loadStudentSubjects(true);
  }

  onCourseEnroll(card: CourseCardViewModel): void {
    // TODO: Reemplazar mock por integracion con el endpoint oficial de inscripcion a cursado.
    this.courseEnrollmentsOptimistic.update((current) => {
      const next = new Set(current);
      next.add(card.subjectId);
      return next;
    });
    this.messages.add({
      severity: 'info',
      summary: 'Gestion pendiente',
      detail: `${card.subjectName}: la confirmacion final se realizara cuando se conecte el endpoint oficial.`,
      life: 4000,
    });
  }

  onViewCourseTables(card: CourseCardViewModel): void {
    if (this.filters.subjectId !== card.subjectId) {
      this.filters.subjectId = card.subjectId;
      this.applyFilters();
    }
    this.scrollToTables();
  }

  trackCourseCard(_: number, card: CourseCardViewModel): number {
    return card.subjectId;
  }

  onEnroll(row: ExamCallRow, event?: MouseEvent): void {
    this.lastActionTrigger = (event?.currentTarget as HTMLElement) ?? null;
    const validation = this.validateRow(row);
    if (validation.blocked) {
      this.showBlock(validation.reason, validation.message, row);
      this.audit(row, 'blocked', validation.reason);
      return;
    }
    this.selectedRow = row;
    this.dialogVisible = true;
  }

  cancelDialog(): void {
    this.dialogVisible = false;
    this.selectedRow = null;
    this.restoreFocus();
  }

  confirmEnroll(): void {
    const row = this.selectedRow;
    if (!row) return;
    this.dialogVisible = false;
    this.inscriptions
      .enroll({ mesaId: row.mesaId, callId: row.call.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (response.ok) {
          this.messages.add({
            severity: 'success',
            summary: 'Inscripcion confirmada',
            detail: `${row.subjectName} - ${row.call.label}`,
            life: 4000,
          });
          // Optimista: marcar la materia como inscripta para esta mesa
          try {
            (row.table as any).duplicateEnrollment = true;
          } catch {}
          this.enrolledLocal.add(row.call.id);
          this.persistEnrolledLocal();
          this.blockAlert.set(null);
          this.audit(row, 'success');
          this.refreshData(true);
        } else {
          const reason =
            (response.reasonCode as StudentExamBlockReason) ?? 'UNKNOWN';
          this.showBlock(reason, response.message ?? '', row);
          this.audit(row, 'blocked', reason);
        }
        this.restoreFocus();
        this.selectedRow = null;
      });
  }

  private refreshData(force = false): void {
    this.inscriptions
      .refresh({ refresh: force })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private loadStudentSubjects(force = false): void {
    if (force) {
      this.courseEnrollmentsOptimistic.set(new Set());
    }
    this.studentStatus
      .loadStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private flattenRows(tables: StudentExamTable[]): ExamCallRow[] {
    const formatter = new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
    });
    return tables.flatMap((table) =>
      table.availableCalls.map((call) => {
        let opens = call.enrollmentWindow.opensAt;
        let closes = call.enrollmentWindow.closesAt;
        // Si el alumno está inscripto y la ventana no tiene rango publicado,
        // asumir que la ventana corresponde al día del examen y cierra al día siguiente.
        if (call.enrolled && (!opens || !closes) && call.examDate) {
          opens = call.examDate;
          const dt = new Date(call.examDate);
          dt.setDate(dt.getDate() + 1);
          closes = dt.toISOString().slice(0, 10);
        }
        const windowRange =
          opens && closes
            ? `${formatter.format(new Date(opens))} - ${formatter.format(
                new Date(closes),
              )}`
            : 'Sin rango publicado';
        const quotaText =
          call.quotaTotal && call.quotaUsed !== null
            ? `${call.quotaUsed}/${call.quotaTotal}`
            : call.quotaTotal
              ? `Hasta ${call.quotaTotal}`
              : 'Sin cupo publicado';
        // Determine effective window state: prefer call.enrollmentWindow.state but
        // if we forced opens/closes above for an enrolled call, treat it as 'open'.
        const effectiveState =
          call.enrollmentWindow.state === 'open' || (call.enrolled && opens && closes)
            ? 'open'
            : call.enrollmentWindow.state;

        return {
          mesaId: table.mesaId,
          callId: call.id,
          subjectId: table.subjectId,
          subjectName: table.subjectName,
          commissionLabel: table.commissionLabel ?? null,
          call,
          windowState: effectiveState as StudentWindowState,
          windowRange,
          quotaText,
          table,
        };
      }),
    );
  }

  private validateRow(
    row: ExamCallRow,
  ):
    | { blocked: false }
    | { blocked: true; reason: StudentExamBlockReason; message: string } {
    const block = this.resolveBlock(row);
    if (!block) {
      return { blocked: false };
    }
    return { blocked: true, ...block };
  }

  private buildFilterPayload() {
    const current = this.filters;
    const [from, to] = current.dateRange ?? [null, null];
    return {
      subjectId: current.subjectId ?? undefined,
      from: from ? this.toIso(from) : undefined,
      to: to ? this.toIso(to) : undefined,
      windowState: current.windowState,
    };
  }

  private toIso(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private showBlock(
    reason: StudentExamBlockReason | null,
    customMessage?: string,
    row?: ExamCallRow,
  ): void {
    const template = BLOCK_COPY[reason ?? 'DEFAULT'] ?? BLOCK_COPY.DEFAULT;

    // Compose an official, accessible list when correlatives are missing
    const msg: string | string[] =
      reason === 'MISSING_REQUIREMENTS'
        ? this.composeCorrelativeMessage(row, customMessage)
        : customMessage?.trim()?.length
          ? customMessage
          : template.message;

    this.blockAlert.set({
      title: template.title,
      variant: template.variant,
      message: msg,
      reasonCode: reason ?? 'UNKNOWN',
    });
  }

  private composeCorrelativeMessage(
    row: ExamCallRow | null | undefined,
    backendMessage?: string | null,
  ): string[] {
    const lines: string[] = [];
    lines.push('Correlativas faltantes para inscribirte:');
    // If backend provided a detailed message, split into readable lines
    const raw = (backendMessage ?? row?.table.academicRequirement ?? '').trim();
    if (raw) {
      const parts = raw
        .split(/\r?\n|;|\u2022|\-/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (parts.length) {
        return lines.concat(parts);
      }
    }
    // Fallback with subject context to keep it clear
    const code = row?.table.subjectCode ? `(${row?.table.subjectCode}) ` : '';
    const name = row?.table.subjectName ?? 'la materia seleccionada';
    lines.push(
      `${code}${name}: Debes tener Regularizada o Aprobada la(s) correlativa(s) establecida(s).`,
    );
    return lines;
  }

  private audit(
    row: ExamCallRow,
    outcome: 'success' | 'blocked' | 'error',
    reasonCode?: StudentExamBlockReason,
  ): void {
    const basePayload: any = {
      context: 'enroll-exam',
      mesaId: row.mesaId,
      callId: row.call.id,
      outcome,
      reasonCode,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      subjectCode: row.table.subjectCode ?? null,
      timestamp: new Date().toISOString(),
    };
    if (reasonCode === 'MISSING_REQUIREMENTS') {
      basePayload.missingCorrelativesText = this.composeCorrelativeMessage(
        row,
        row.table.academicRequirement,
      );
    }
    this.inscriptions
      .logAudit(basePayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private restoreFocus(): void {
    setTimeout(() => this.lastActionTrigger?.focus(), 0);
  }

  navigateToStatus(): void {
    void this.router.navigate(['/alumno/situacion-academica']);
  }

  blockTooltip(row: ExamCallRow): string | undefined {
    return this.resolveBlock(row)?.message || undefined;
  }

  isEnrolled(row: ExamCallRow): boolean {
    // Preferir estado por llamado (proporcionado por backend).
    // Fallback a marca local optimista en esta sesión.
    return Boolean(row.call?.enrolled) || this.enrolledLocal.has(row.call.id);
  }

  isActionBlocked(row: ExamCallRow): boolean {
    // No permitir acción si ya quedó inscripto (optimista o por backend)
    if (this.isEnrolled(row)) return true;
    return !!this.resolveBlock(row);
  }

  private persistEnrolledLocal(): void {
    try {
      sessionStorage.setItem(
        this.enrolledStorageKey,
        JSON.stringify(Array.from(this.enrolledLocal.values())),
      );
    } catch {}
  }

  onUnenroll(row: ExamCallRow): void {
    const studentId = this.auth.getUserId();
    if (!studentId) return;
    this.api
      .toggleFinalEnrollment({
        finalExamId: row.call.id,
        studentId,
        action: 'unenroll',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: 'Inscripción anulada',
            detail: `${row.subjectName} - ${row.call.label}`,
            life: 3000,
          });
          try {
            (row.table as any).duplicateEnrollment = false;
          } catch {}
          this.enrolledLocal.delete(row.call.id);
          this.persistEnrolledLocal();
          this.refreshData();
        },
        error: () =>
          this.messages.add({
            severity: 'error',
            summary: 'No se pudo anular',
            life: 3000,
          }),
      });
  }

  stateLabel(state: StudentWindowState): string {
    switch (state) {
      case 'open':
        return 'Abierta';
      case 'upcoming':
        return 'Proxima';
      case 'past':
        return 'Finalizada';
      default:
        return 'Cerrada';
    }
  }

  stateSeverity(state: StudentWindowState): 'success' | 'info' | 'danger' {
    switch (state) {
      case 'open':
        return 'success';
      case 'upcoming':
        return 'info';
      default:
        return 'danger';
    }
  }

  private mapCourseCard(
    card: StudentSubjectCard,
    optimistic: Set<number>,
  ): CourseCardViewModel {
    const alreadyEnrolled =
      this.hasOngoingEnrollment(card) || optimistic.has(card.subjectId);
    return {
      subjectId: card.subjectId,
      subjectName: card.subjectName,
      commissionLabel: card.commissionLabel,
      notes: card.notes,
      attendancePct: card.attendancePct,
      finalScore: card.finalScore,
      accreditation: card.accreditation,
      condition: card.condition,
      statusLabel: this.buildCourseStatus(card),
      statusSeverity: this.resolveCourseSeverity(card),
      showEnrollCta: !alreadyEnrolled && card.actions.canEnrollCourse,
      isEnrolled: alreadyEnrolled,
      raw: card,
    };
  }

  private buildCourseStatus(card: StudentSubjectCard): string {
    const base = card.accreditation || card.condition || 'Sin estado';
    return base.toUpperCase();
  }

  private resolveCourseSeverity(card: StudentSubjectCard): ButtonSeverity {
    const value = (card.accreditation || card.condition || '').toLowerCase();
    if (value.includes('promo') || value.includes('apro')) return 'success';
    if (value.includes('regular') || value.includes('curso')) return 'info';
    if (value.includes('pend') || value.includes('libre')) return 'warn';
    return 'secondary';
  }

  private hasOngoingEnrollment(card: StudentSubjectCard): boolean {
    const keywords = ['curso', 'regular', 'promo', 'apro'];
    const normalized = (card.condition || '').toLowerCase();
    const accreditation = (card.accreditation || '').toLowerCase();
    return keywords.some(
      (keyword) =>
        normalized.includes(keyword) || accreditation.includes(keyword),
    );
  }

  private scrollToTables(): void {
    const doc = this.documentRef;
    if (!doc) return;
    const anchor =
      doc.getElementById('mesas-disponibles') ??
      doc.querySelector('.mesas-disponibles');
    anchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private resolveBlock(
    row: ExamCallRow,
  ): { reason: StudentExamBlockReason; message: string } | null {
    const call = row.call;
    const table = row.table;
    if (call.enrollmentWindow.state !== 'open') {
      return {
        reason: 'WINDOW_CLOSED',
        message: `El periodo estuvo disponible hasta ${row.windowRange}.`,
      };
    }
    if (table.academicRequirement) {
      return {
        reason: 'MISSING_REQUIREMENTS',
        message: table.academicRequirement,
      };
    }
    if (table.duplicateEnrollment) {
      return {
        reason: 'DUPLICATE',
        message: 'Ya tenes una inscripcion vigente para este llamado.',
      };
    }
    const quotaTotal = call.quotaTotal ?? null;
    const quotaUsed = call.quotaUsed ?? null;
    if (quotaTotal !== null && quotaUsed !== null && quotaUsed >= quotaTotal) {
      return {
        reason: 'QUOTA_FULL',
        message: 'El cupo informado fue alcanzado.',
      };
    }
    return null;
  }

  private observeSyncEvents(): void {
    this.sync.changes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.inscriptions.invalidateCache();
        this.refreshData(true);
      });
  }

  private setupVisibilityRefresh(): void {
    const doc = this.documentRef;
    if (!doc) {
      return;
    }
    const handler = () => {
      if (doc.visibilityState === 'visible') {
        this.refreshData(true);
      }
    };
    doc.addEventListener('visibilitychange', handler);
    this.destroyRef.onDestroy(() =>
      doc.removeEventListener('visibilitychange', handler),
    );
  }
}
