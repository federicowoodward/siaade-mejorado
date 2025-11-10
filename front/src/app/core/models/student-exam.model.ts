export type StudentWindowState = 'open' | 'upcoming' | 'closed' | 'past';

export type StudentExamBlockReason =
  | 'WINDOW_CLOSED'
  | 'MISSING_REQUIREMENTS'
  | 'DUPLICATE'
  | 'QUOTA_FULL'
  | 'BACKEND_BLOCK'
  | 'UNKNOWN';

export interface StudentActionWindow {
  id?: number;
  label: string;
  opensAt: string;
  closesAt: string;
  state: StudentWindowState;
  message?: string | null;
  isAdditional?: boolean;
}

export interface StudentExamCall {
  id: number;
  label: string;
  examDate: string;
  aula?: string | null;
  quotaTotal?: number | null;
  quotaUsed?: number | null;
  enrollmentWindow: StudentActionWindow;
  additional?: boolean;
}

export interface StudentExamTable {
  mesaId: number;
  subjectId: number;
  subjectName: string;
  subjectCode?: string | null;
  commissionLabel?: string | null;
  availableCalls: StudentExamCall[];
  duplicateEnrollment?: boolean;
  blockedReason?: StudentExamBlockReason | null;
  blockedMessage?: string | null;
  academicRequirement?: string | null;
}

export interface StudentExamFilters {
  subjectId?: number | null;
  from?: string | null;
  to?: string | null;
  windowState?: StudentWindowState | 'all';
}

export interface StudentEnrollPayload {
  mesaId: number;
  callId: number;
  studentId?: string;
  reasonCode?: string;
}

export interface StudentEnrollmentResponse {
  ok: boolean;
  blocked?: boolean;
  reasonCode?: StudentExamBlockReason | string | null;
  message?: string | null;
  refreshRequired?: boolean;
}

export interface StudentExamAuditPayload {
  context: 'enroll-exam';
  mesaId: number;
  callId?: number;
  outcome: 'success' | 'blocked' | 'error';
  reasonCode?: StudentExamBlockReason | string | null;
  // Optional context for richer auditing on blocked attempts
  subjectId?: number;
  subjectName?: string;
  subjectCode?: string | null;
  missingCorrelativesText?: string | string[] | null;
  timestamp?: string; // ISO string set client-side when available
}
