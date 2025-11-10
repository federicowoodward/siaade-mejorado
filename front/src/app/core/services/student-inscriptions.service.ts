import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {
  StudentActionWindow,
  StudentExamAuditPayload,
  StudentExamBlockReason,
  StudentExamCall,
  StudentExamFilters,
  StudentExamTable,
  StudentEnrollPayload,
  StudentEnrollmentResponse,
  StudentWindowState,
} from '../models/student-exam.model';

type RawExamTablesResponse =
  | { data?: any[] }
  | { items?: any[] }
  | { tables?: any[] }
  | any[];

const buildParamsCacheKey = (params: Record<string, string>): string => {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  return JSON.stringify(sorted);
};

@Injectable({ providedIn: 'root' })
export class StudentInscriptionsService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly tablesSignal = signal<StudentExamTable[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly filtersSignal = signal<StudentExamFilters | undefined>(undefined);
  private readonly cacheTtlMs = 30_000;
  private cacheEntry: { key: string; data: StudentExamTable[]; ts: number } | null =
    null;
  private pendingRefresh = false;

  readonly tables = this.tablesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  private readonly reasonAliases: Record<string, StudentExamBlockReason> = {
    WINDOW_CLOSED: 'WINDOW_CLOSED',
    WINDOWS_CLOSED: 'WINDOW_CLOSED',
    WINDOW: 'WINDOW_CLOSED',
    MISSING_REQUIREMENTS: 'MISSING_REQUIREMENTS',
    REQUIREMENTS: 'MISSING_REQUIREMENTS',
    CORRELATIVE: 'MISSING_REQUIREMENTS',
    DUPLICATE: 'DUPLICATE',
    DUPLICATED: 'DUPLICATE',
    ALREADY_ENROLLED: 'DUPLICATE',
    QUOTA_FULL: 'QUOTA_FULL',
    FULL: 'QUOTA_FULL',
    CAPACITY: 'QUOTA_FULL',
    BACKEND_BLOCK: 'BACKEND_BLOCK',
    UNKNOWN: 'UNKNOWN',
  };

  listExamTables(
    filters: StudentExamFilters = {},
    options?: { refresh?: boolean }
  ): Observable<StudentExamTable[]> {
    const params = this.serializeFilters(filters);
    const cacheKey = buildParamsCacheKey(params);
    const forceRefresh = options?.refresh === true || this.pendingRefresh;
    this.filtersSignal.set({ ...filters });

    const cached =
      !forceRefresh &&
      this.cacheEntry &&
      this.cacheEntry.key === cacheKey &&
      Date.now() - this.cacheEntry.ts <= this.cacheTtlMs
        ? this.cacheEntry.data
        : null;

    if (cached) {
      this.tablesSignal.set(cached);
      this.loadingSignal.set(false);
      return of(cached);
    }

    this.loadingSignal.set(true);

    return this.api
      .request<RawExamTablesResponse>(
        'GET',
        'students/inscriptions/exam-tables',
        undefined,
        params
      )
      .pipe(
        map((payload) => this.mapExamTables(payload)),
        tap((tables) => {
          this.tablesSignal.set(tables);
          this.cacheEntry = { key: cacheKey, data: tables, ts: Date.now() };
          this.pendingRefresh = false;
        }),
        catchError((error) => {
          console.error('[StudentInscriptions] listExamTables failed', error);
          this.tablesSignal.set([]);
          this.cacheEntry = null;
          return of([]);
        }),
        finalize(() => this.loadingSignal.set(false))
      );
  }

  refresh(options?: { refresh?: boolean }): Observable<StudentExamTable[]> {
    return this.listExamTables(this.filtersSignal() ?? {}, {
      refresh: options?.refresh ?? true,
    });
  }

  invalidateCache(): void {
    this.cacheEntry = null;
    this.pendingRefresh = true;
  }

  consumePendingRefresh(): boolean {
    const pending = this.pendingRefresh;
    if (pending) {
      this.pendingRefresh = false;
    }
    return pending;
  }

  enroll(payload: StudentEnrollPayload): Observable<StudentEnrollmentResponse> {
    const studentId = payload.studentId ?? this.auth.getUserId();
    const body = {
      mesaId: payload.mesaId,
      callId: payload.callId,
      studentId,
      reasonCode: payload.reasonCode ?? null,
    };
    return this.api
      .request<any>(
        'POST',
        `students/inscriptions/exam-tables/${payload.mesaId}/enroll`,
        body
      )
      .pipe(
        map((resp) => this.normalizeEnrollmentResponse(resp)),
        catchError((error) =>
          of(this.normalizeEnrollmentResponse(error?.error ?? error))
        )
      );
  }

  logAudit(payload: StudentExamAuditPayload): Observable<void> {
    return this.api
      .request<void>('POST', 'students/inscriptions/audit-events', payload)
      .pipe(
        catchError((error) => {
          console.warn('[StudentInscriptions] audit failed', error);
          return of(void 0);
        })
      );
  }

  private serializeFilters(filters: StudentExamFilters): Record<string, string> {
    const params: Record<string, string> = {};
    if (filters.subjectId) params["subjectId"] = String(filters.subjectId);
    if (filters.from) params["from"] = this.normalizeDate(filters.from);
    if (filters.to) params["to"] = this.normalizeDate(filters.to);
    if (filters.windowState && filters.windowState !== 'all') {
      params["windowState"] = filters.windowState;
    }
    return params;
  }

  private mapExamTables(payload: RawExamTablesResponse): StudentExamTable[] {
    const rows = this.unwrap(payload);
    return rows.map((row) => {
      const calls = this.mapCalls(row);
      return {
        mesaId: Number(row.mesaId ?? row.id ?? row.tableId ?? row.examTableId ?? 0),
        subjectId: Number(
          row.subjectId ??
            row.subject_id ??
            row.subject?.id ??
            row.subject?.subjectId ??
            0
        ),
        subjectName:
          row.subjectName ??
          row.subject_name ??
          row.subject?.name ??
          row.subject?.subjectName ??
          'Materia sin nombre',
        subjectCode: row.subjectCode ?? row.subject?.code ?? null,
        commissionLabel:
          row.commissionLabel ??
          row.commission?.letter ??
          row.commission ??
          null,
        availableCalls: calls,
        duplicateEnrollment: Boolean(
          row.duplicateEnrollment ?? row.duplicate ?? row.alreadyEnrolled
        ),
        blockedReason: this.resolveReason(row.reasonCode ?? row.blockedReason),
        blockedMessage: row.blockedMessage ?? row.message ?? null,
        academicRequirement: row.academicRequirement ?? row.planRequirement ?? null,
      };
    });
  }

  private mapCalls(row: any): StudentExamCall[] {
    const source = Array.isArray(row.calls)
      ? row.calls
      : Array.isArray(row.availableCalls)
      ? row.availableCalls
      : row.call
      ? [row.call]
      : [];
    if (source.length) {
      return source
        .map((raw: any) => this.normalizeCall(raw))
        .filter(
          (call: StudentExamCall | null): call is StudentExamCall => !!call
        );
    }

    const fallback = this.normalizeCall({
      id: row.callId ?? row.id,
      label: row.callLabel ?? row.windowLabel ?? 'Llamado',
      examDate: row.examDate ?? row.date ?? row.exam_date ?? row.examDay,
      aula: row.aula ?? row.room ?? null,
      quotaTotal: row.quota ?? row.quotaTotal ?? null,
      quotaUsed: row.quotaUsed ?? row.enrolledCount ?? null,
      enrollmentWindow: row.window ?? row.enrollmentWindow ?? null,
      additional: row.additionalCall ?? row.isAdditional ?? false,
    });
    return fallback ? [fallback] : [];
  }

  private normalizeCall(input: any): StudentExamCall | null {
    if (!input) return null;
    const id = Number(input.id ?? input.callId);
    if (!Number.isFinite(id)) return null;
    const window = this.normalizeWindow(
      input.enrollmentWindow ?? input.window ?? input.enrollment
    );
    return {
      id,
      label: input.label ?? input.name ?? 'Llamado',
      examDate: this.normalizeDate(input.examDate ?? input.date ?? null),
      aula: input.aula ?? input.room ?? null,
      quotaTotal: this.toNumber(input.quotaTotal ?? input.quota),
      quotaUsed: this.toNumber(input.quotaUsed ?? input.enrolled),
      enrollmentWindow: window,
      additional: Boolean(input.additional ?? input.isAdditional ?? false),
    };
  }

  private normalizeWindow(window: any): StudentActionWindow {
    const opensAt = this.normalizeDate(window?.opensAt ?? window?.start ?? window?.from);
    const closesAt = this.normalizeDate(window?.closesAt ?? window?.end ?? window?.to);
    return {
      id: window?.id ?? window?.windowId,
      label: window?.label ?? 'Ventana',
      opensAt,
      closesAt,
      state: this.resolveWindowState(opensAt, closesAt),
      message: window?.message ?? null,
      isAdditional: Boolean(window?.isAdditional ?? window?.additional ?? false),
    };
  }

  private resolveWindowState(opensAt?: string | null, closesAt?: string | null): StudentWindowState {
    if (!opensAt || !closesAt) return 'closed';
    const now = Date.now();
    const start = Date.parse(opensAt);
    const end = Date.parse(closesAt);
    if (Number.isNaN(start) || Number.isNaN(end)) return 'closed';
    if (now < start) return 'upcoming';
    if (now > end) return 'past';
    return 'open';
  }

  private normalizeEnrollmentResponse(resp: any): StudentEnrollmentResponse {
    if (!resp) {
      return {
        ok: false,
        blocked: true,
        reasonCode: 'UNKNOWN',
        message:
          'No se pudo procesar la inscripción. Intentá nuevamente en unos minutos.',
      };
    }
    const resolvedReason = this.resolveReason(resp.reasonCode ?? resp.code);
    const blocked =
      resp.blocked === true ||
      resp.ok === false ||
      Boolean(resolvedReason) ||
      resp.status === 'blocked';
    return {
      ok: !blocked,
      blocked,
      reasonCode: resolvedReason ?? resp.reasonCode ?? null,
      message:
        resp.message ??
        resp.detail ??
        (blocked
          ? 'La inscripción fue bloqueada por el sistema.'
          : 'Inscripción realizada correctamente.'),
      refreshRequired: resp.refresh === true || resp.refreshRequired === true,
    };
  }

  private resolveReason(
    raw: string | null | undefined
  ): StudentExamBlockReason | null {
    if (!raw) return null;
    const normalized = String(raw).trim().toUpperCase();
    return this.reasonAliases[normalized] ?? null;
  }

  private unwrap(payload: RawExamTablesResponse): any[] {
    if (Array.isArray(payload)) return payload;
    if (
      payload &&
      typeof payload === 'object' &&
      'data' in payload &&
      Array.isArray((payload as any).data)
    ) {
      return (payload as any).data;
    }
    if (
      payload &&
      typeof payload === 'object' &&
      'items' in payload &&
      Array.isArray((payload as any).items)
    ) {
      return (payload as any).items;
    }
    if (
      payload &&
      typeof payload === 'object' &&
      'tables' in payload &&
      Array.isArray((payload as any).tables)
    ) {
      return (payload as any).tables;
    }
    return [];
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
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
}
