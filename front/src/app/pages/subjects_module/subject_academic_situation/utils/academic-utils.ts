import { AcademicSituationRow } from '../subject-academic-situation.types';

export function rowsTrackBy(_: number, item: AcademicSituationRow): string {
  return item.studentId;
}

export function computeFinalForRow(
  row: AcademicSituationRow,
  partialsCount?: number
): number | null {
  const usesFourPartials = partialsCount === 4;
  const rawValues =
    usesFourPartials
      ? [row.note1, row.note2, row.note3, row.note4]
      : [row.note1, row.note2];

  const numericValues = rawValues.filter(
    (value): value is number =>
      typeof value === 'number' &&
      !Number.isNaN(value) &&
      value >= 0 &&
      value <= 10
  );

  if (numericValues.length === 0) {
    return null;
  }

  const divisor = usesFourPartials ? 4 : 2;
  const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
  const average = sum / divisor;

  if (!Number.isFinite(average)) {
    return null;
  }

  return Number(average.toFixed(2));
}

export function parseGradeValue(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric < 0 || numeric > 10) {
    return undefined;
  }
  return numeric;
}

export function parseAttendanceValue(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric < 0 || numeric > 100) {
    return undefined;
  }
  return Math.round(numeric);
}

export function isGradeApproved(score: number | null): boolean {
  return score !== null && score >= 4 && score < 7;
}

export function isGradePromoted(score: number | null): boolean {
  return score !== null && score >= 7;
}

export function isGradeDisapproved(score: number | null): boolean {
  return score !== null && score < 4;
}

export function finalClass(score: number | null): string {
  if (score === null || score === undefined) return '';
  if (isGradePromoted(score)) return 'nota-promocionada';
  if (isGradeApproved(score)) return 'nota-aprobada';
  if (isGradeDisapproved(score)) return 'nota-desaprobada';
  return '';
}
