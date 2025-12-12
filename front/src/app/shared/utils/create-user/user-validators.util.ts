// src/app/shared/utils/user-validators.util.ts
import { ROLE_REQUIREMENTS, UserRole } from './role-config';

export const MIN_AGE_YEARS = 16;
export const MIN_START_YEAR = 1990;
export const MAX_START_YEAR = 2100;

export function parseDateOnly(value: string): Date | null {
  if (!value) return null;
  const parts = value.split('-').map((p) => Number(p));
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function addYears(date: Date, years: number): Date {
  const clone = new Date(date.getTime());
  clone.setUTCFullYear(clone.getUTCFullYear() + years);
  return clone;
}

export function hasMinAge(
  birthDate: string,
  minAgeYears: number = MIN_AGE_YEARS,
  referenceDate: Date = new Date(),
): boolean {
  const parsed = parseDateOnly(birthDate);
  if (!parsed) return false;

  const ref = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
    ),
  );
  ref.setUTCFullYear(ref.getUTCFullYear() - minAgeYears);
  return parsed <= ref;
}

export function isValidStudentStartYear(
  birthDate: string,
  startYear: number | null | undefined,
  minAgeYears: number = MIN_AGE_YEARS,
): boolean {
  if (startYear === null || startYear === undefined) return true;
  if (!Number.isInteger(startYear)) return false;
  if (startYear < MIN_START_YEAR || startYear > MAX_START_YEAR) return false;
  const parsedBirth = parseDateOnly(birthDate);
  if (!parsedBirth) return false;

  const startYearDate = new Date(Date.UTC(startYear, 11, 31));
  const minStartDate = addYears(parsedBirth, minAgeYears);
  return startYearDate >= minStartDate;
}

export function canCreateBase(
  role: UserRole | null,
  email: string,
  cuil: string,
): boolean {
  return !!role && !!email && !!(cuil || 'pass1234');
}

export function canCreateStep2(params: {
  role: UserRole | null;
  sex: string;
  birthDate: string;
  legajo?: string;
  studentStartYear?: number | null;
  minAgeYears?: number;
  referenceDate?: Date;
}): boolean {
  const {
    role,
    sex,
    birthDate,
    legajo,
    studentStartYear,
    minAgeYears = MIN_AGE_YEARS,
    referenceDate = new Date(),
  } = params;
  if (!role) return false;
  const req = ROLE_REQUIREMENTS[role];

  if (req.needsCommonData) {
    if (!sex || !birthDate) return false;
    if (!hasMinAge(birthDate, minAgeYears, referenceDate)) return false;
  }
  if (role === 'student') {
    if (!legajo || !String(legajo).trim()) return false;
    if (!isValidStudentStartYear(birthDate, studentStartYear, minAgeYears)) {
      return false;
    }
  }
  return true;
}
