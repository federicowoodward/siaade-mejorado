import { Injectable, inject, signal } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {
  StudentActionWindow,
  StudentExamBlockReason,
  StudentWindowState,
} from '../models/student-exam.model';

export interface StudentSubjectNote {
  label: string;
  value: number | null;
}

export interface SubjectActionAvailability {
  canEnrollCourse: boolean;
  canEnrollExam: boolean;
  courseReason?: StudentExamBlockReason | string | null;
  examReason?: StudentExamBlockReason | string | null;
  courseWindow?: StudentActionWindow | null;
  examWindow?: StudentActionWindow | null;
}

export interface StudentSubjectCard {
  subjectId: number;
  subjectName: string;
  yearLabel: string;
  commissionLabel: string | null;
  partialsExpected: 2 | 4;
  notes: StudentSubjectNote[];
  finalScore: number | null;
  finalExplanation: string;
  attendancePct: number;
  condition: string | null;
  accreditation: string;
  actions: SubjectActionAvailability;
}

type RawStatusResponse = {
  studentId?: string;
  subjects?: any[];
  byYear?: Record<string, any[]>;
};

type RawContextResponse = {
  courseWindow?: any;
  examWindow?: any;
  course?: any;
  exam?: any;
  windows?: {
    course?: any;
    exam?: any;
  };
  correlatives?: Array<{
    subjectId?: number;
    subject_id?: number;
    ok?: boolean;
    met?: boolean;
    satisfied?: boolean;
  }>;
  duplicates?: Array<string | number>;
  duplicateSubjects?: Array<string | number>;
  quotaFull?: Array<string | number>;
  quotaBlockedSubjects?: Array<string | number>;
};

interface ActionContext {
  courseWindow: StudentActionWindow | null;
  examWindow: StudentActionWindow | null;
  correlatives: Record<number, boolean>;
  duplicates: Set<number>;
  quotaFull: Set<number>;
}

@Injectable({ providedIn: 'root' })
export class StudentStatusService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly statusSignal = signal<StudentSubjectCard[]>([]);
  private readonly loadingSignal = signal(false);

  readonly status = this.statusSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  loadStatus(studentId?: string | null): Observable<StudentSubjectCard[]> {
    this.loadingSignal.set(true);
    const effectiveStudentId = studentId ?? this.auth.getUserId();

    return forkJoin({
      subjects: this.fetchStatus(effectiveStudentId),
      context: this.fetchContext(effectiveStudentId),
    }).pipe(
      map(({ subjects, context }) =>
        this.mapCards(subjects, context, effectiveStudentId),
      ),
      tap((cards) => this.statusSignal.set(cards)),
      catchError((error) => {
        console.error('[StudentStatus] loadStatus failed', error);
        this.statusSignal.set([]);
        return of([]);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  private fetchStatus(
    studentId?: string | null,
  ): Observable<RawStatusResponse> {
    const params = studentId ? { studentId } : undefined;
    return this.api
      .request<RawStatusResponse>(
        'GET',
        'students/status/subjects',
        undefined,
        params,
      )
      .pipe(
        catchError((error) => {
          if (!studentId) {
            return throwError(() => error);
          }
          console.warn(
            '[StudentStatus] Falling back to catalogs endpoint',
            error,
          );
          return this.api
            .request<any>(
              'GET',
              `catalogs/student/${studentId}/academic-status`,
            )
            .pipe(map((legacy) => this.legacyToNew(legacy, studentId)));
        }),
      );
  }

  private fetchContext(studentId?: string | null): Observable<ActionContext> {
    const params = studentId ? { studentId } : undefined;
    return this.api
      .request<RawContextResponse>(
        'GET',
        'students/status/action-context',
        undefined,
        params,
      )
      .pipe(
        map((payload) => this.mapContext(payload)),
        catchError((error) => {
          console.warn('[StudentStatus] context endpoint unavailable', error);
          return of(this.buildFallbackContext());
        }),
      );
  }

  private mapCards(
    raw: RawStatusResponse,
    context: ActionContext,
    studentId?: string | null,
  ): StudentSubjectCard[] {
    const subjects = raw?.subjects ?? [];
    if (!subjects.length && raw?.byYear) {
      return this.mapCards(
        this.legacyToNew(raw, studentId),
        context,
        studentId,
      );
    }
    return subjects
      .map((row: any) => this.mapCard(row, context))
      .sort((a, b) => {
        const yearCompare = a.yearLabel.localeCompare(b.yearLabel);
        if (yearCompare !== 0) return yearCompare;
        return a.subjectName.localeCompare(b.subjectName);
      });
  }

  private mapCard(row: any, context: ActionContext): StudentSubjectCard {
    const partials = this.resolvePartials(row.partials);
    const notes = this.buildNotes(row, partials);
    const attendance =
      this.toNumber(row.attendancePercentage ?? row.attendance) ?? 0;
    const finalScore = this.toNumber(row.final ?? row.finalScore);
    return {
      subjectId: Number(row.subjectId ?? row.id ?? 0),
      subjectName:
        row.subjectName ?? row.subject_name ?? row.name ?? 'Materia sin nombre',
      yearLabel: this.resolveYearLabel(row),
      commissionLabel:
        row.commissionLetter ??
        row.commission_label ??
        row.division ??
        row.commission ??
        null,
      partialsExpected: partials,
      notes,
      finalScore,
      finalExplanation: this.buildFinalExplanation(partials, notes, attendance),
      attendancePct: attendance,
      condition: row.condition ?? row.status ?? null,
      accreditation: this.deriveAccreditation(row),
      actions: this.buildActions(row, context),
    };
  }

  private resolvePartials(value: unknown): 2 | 4 {
    const numeric = Number(value);
    if (numeric === 4) return 4;
    return 2;
  }

  private buildNotes(row: any, partials: 2 | 4): StudentSubjectNote[] {
    const labels = ['P1', 'P2', 'P3', 'P4'];
    const values = [
      row.note1 ?? row.p1,
      row.note2 ?? row.p2,
      row.note3 ?? row.p3,
      row.note4 ?? row.p4,
    ];
    return labels.slice(0, partials).map((label, idx) => ({
      label,
      value: this.toNumber(values[idx]),
    }));
  }

  private buildFinalExplanation(
    partials: 2 | 4,
    notes: StudentSubjectNote[],
    attendance: number,
  ): string {
    const validNotes = notes
      .map((n) => n.value)
      .filter((value): value is number => typeof value === 'number');
    if (!validNotes.length) {
      return `Se requieren ${partials} parciales para calcular la nota final.`;
    }
    const average =
      validNotes.reduce((acc, value) => acc + value, 0) / validNotes.length;
    const rounded = Math.round(average * 10) / 10;
    const attendanceText =
      attendance >= 75
        ? 'La asistencia cumple el minimo requerido.'
        : 'La asistencia no alcanza el 75%.';
    return `Promedio de ${validNotes.length} parciales (${partials} esperados): ${rounded}. ${attendanceText}`;
  }

  private deriveAccreditation(row: any): string {
    if (row.accreditation) return row.accreditation;
    const condition = String(row.condition ?? '').toLowerCase();
    if (condition.includes('promo')) return 'Promocionada';
    if (condition.includes('apro')) return 'Aprobada';
    if (condition.includes('regular')) return 'Regularizada';
    if (condition.includes('libre')) return 'Pendiente';
    return 'En curso';
  }

  private buildActions(
    row: any,
    context: ActionContext,
  ): SubjectActionAvailability {
    const subjectId = Number(row.subjectId ?? row.id ?? 0);
    const correlativesMet =
      context.correlatives[subjectId] ?? context.correlatives[0] ?? true;
    const duplicate = context.duplicates.has(subjectId);
    const quotaFull = context.quotaFull.has(subjectId);

    const courseWindow = context.courseWindow;
    const examWindow = context.examWindow;

    const courseWindowOpen = courseWindow?.state === 'open';
    const courseNeeds =
      String(row.condition ?? '').toLowerCase() !== 'aprobado' &&
      String(row.condition ?? '').toLowerCase() !== 'promocionado';

    let courseReason: StudentExamBlockReason | null = null;
    if (!courseWindowOpen) courseReason = 'WINDOW_CLOSED';
    else if (!correlativesMet) courseReason = 'MISSING_REQUIREMENTS';
    else if (!courseNeeds) courseReason = 'BACKEND_BLOCK';

    const canEnrollCourse = courseNeeds && !courseReason;

    const examWindowOpen = examWindow?.state === 'open';
    const examReady = this.isExamReady(row);
    let examReason: StudentExamBlockReason | null = null;
    if (!examWindowOpen) examReason = 'WINDOW_CLOSED';
    else if (!examReady || !correlativesMet)
      examReason = 'MISSING_REQUIREMENTS';
    else if (duplicate) examReason = 'DUPLICATE';
    else if (quotaFull) examReason = 'QUOTA_FULL';

    const canEnrollExam = !examReason;

    return {
      canEnrollCourse,
      canEnrollExam,
      courseReason,
      examReason,
      courseWindow,
      examWindow,
    };
  }

  private isExamReady(row: any): boolean {
    const condition = String(row.condition ?? '').toLowerCase();
    if (condition.includes('promo') || condition.includes('regular'))
      return true;
    if (condition.includes('aprob')) return true;
    const finalScore = this.toNumber(row.final ?? row.finalScore);
    return typeof finalScore === 'number' && finalScore >= 4;
  }

  private resolveYearLabel(row: any): string {
    if (row.yearLabel) return row.yearLabel;
    const year = row.year ?? row.yearNo ?? row.year_no ?? null;
    if (!year) return 'Sin ano';
    return `${year} Ano`;
  }

  private mapContext(payload: RawContextResponse): ActionContext {
    const courseWindow =
      payload?.windows?.course ??
      payload?.courseWindow ??
      payload?.course ??
      null;
    const examWindow =
      payload?.windows?.exam ?? payload?.examWindow ?? payload?.exam ?? null;
    const correlatives: Record<number, boolean> = {};
    (payload?.correlatives ?? []).forEach((row) => {
      const subjectId = Number(row.subjectId ?? row.subject_id ?? 0);
      correlatives[subjectId] = Boolean(
        row.ok ?? row.met ?? row.satisfied ?? false,
      );
    });
    const duplicates = new Set<number>(
      (payload?.duplicates ?? payload?.duplicateSubjects ?? []).map((value) =>
        Number(value),
      ),
    );
    const quotaFull = new Set<number>(
      (payload?.quotaFull ?? payload?.quotaBlockedSubjects ?? []).map((value) =>
        Number(value),
      ),
    );
    return {
      courseWindow: courseWindow ? this.normalizeWindow(courseWindow) : null,
      examWindow: examWindow ? this.normalizeWindow(examWindow) : null,
      correlatives,
      duplicates,
      quotaFull,
    };
  }

  private normalizeWindow(window: any): StudentActionWindow {
    const opensAt = this.normalizeDate(
      window?.opensAt ?? window?.start ?? window?.from,
    );
    const closesAt = this.normalizeDate(
      window?.closesAt ?? window?.end ?? window?.to,
    );
    return {
      id: window?.id ?? window?.windowId,
      label: window?.label ?? window?.name ?? 'Ventana',
      opensAt,
      closesAt,
      state: this.resolveWindowState(opensAt, closesAt),
      message: window?.message ?? null,
      isAdditional: Boolean(
        window?.isAdditional ?? window?.additional ?? false,
      ),
    };
  }

  private resolveWindowState(
    opensAt?: string | null,
    closesAt?: string | null,
  ): StudentWindowState {
    if (!opensAt || !closesAt) return 'closed';
    const now = Date.now();
    const start = Date.parse(opensAt);
    const end = Date.parse(closesAt);
    if (Number.isNaN(start) || Number.isNaN(end)) return 'closed';
    if (now < start) return 'upcoming';
    if (now > end) return 'past';
    return 'open';
  }

  private buildFallbackContext(): ActionContext {
    const placeholderWindow: StudentActionWindow = {
      label: 'Ventana estandar',
      opensAt: '',
      closesAt: '',
      state: 'open',
      message: null,
    };
    return {
      courseWindow: placeholderWindow,
      examWindow: placeholderWindow,
      correlatives: {},
      duplicates: new Set<number>(),
      quotaFull: new Set<number>(),
    };
  }

  private legacyToNew(
    input: any,
    studentId?: string | null,
  ): RawStatusResponse {
    const subjects: any[] = [];
    const byYear = input?.byYear ?? {};
    Object.entries(byYear).forEach(([yearLabel, rows]) => {
      (rows as any[]).forEach((row) => {
        subjects.push({
          subjectId: row.subjectId ?? row.subject_id ?? row.id,
          subjectName: row.subjectName ?? row.subject_name ?? row.name,
          yearLabel,
          year: row.year ?? row.yearNo ?? null,
          commissionLetter: row.commissionLetter ?? row.division ?? null,
          partials: row.partials ?? (row.note3 !== undefined ? 4 : 2),
          note1: row.note1,
          note2: row.note2,
          note3: row.note3,
          note4: row.note4,
          final: row.final,
          attendancePercentage: row.attendancePercentage ?? row.attendance ?? 0,
          condition: row.condition,
          accreditation: row.accreditation ?? null,
        });
      });
    });
    return {
      studentId: input?.studentId ?? studentId ?? null,
      subjects,
    };
  }

  private normalizeDate(value: string | Date | null | undefined): string {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'string') {
      if (value.includes('T')) return value.slice(0, 10);
      return value;
    }
    return '';
  }

  private toNumber(value: unknown): number | null {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
}
