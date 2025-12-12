import { BadRequestException } from "@nestjs/common";

export const MIN_AGE_YEARS = 16;
export const MIN_STUDENT_START_YEAR = 1990;
export const MAX_STUDENT_START_YEAR = 2100;

export function parseDateOnly(input: string | Date): Date | null {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return new Date(
      Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()),
    );
  }

  const value = `${input ?? ""}`.trim();
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
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

export function assertMinAge(
  birthDateInput: string | Date,
  minYears: number = MIN_AGE_YEARS,
  referenceDate: Date = new Date(),
): Date {
  const birthDate = parseDateOnly(birthDateInput);
  if (!birthDate) {
    throw new BadRequestException(
      "birthDate no es una fecha válida (YYYY-MM-DD)",
    );
  }

  const ref = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
    ),
  );
  ref.setUTCFullYear(ref.getUTCFullYear() - minYears);

  if (birthDate > ref) {
    throw new BadRequestException(
      `birthDate debe indicar al menos ${minYears} años de edad`,
    );
  }
  return birthDate;
}

export function assertStudentStartYear(
  startYearInput: number | null | undefined,
  birthDateInput: string | Date,
  opts?: { minYears?: number },
): number {
  const minYears = opts?.minYears ?? MIN_AGE_YEARS;
  const birthDate = parseDateOnly(birthDateInput);
  if (!birthDate) {
    throw new BadRequestException(
      "birthDate no es una fecha válida (YYYY-MM-DD)",
    );
  }

  const normalizedYear = startYearInput ?? new Date().getUTCFullYear();
  const startYear = Number(normalizedYear);
  if (!Number.isInteger(startYear)) {
    throw new BadRequestException("studentStartYear must be an integer year");
  }
  if (
    startYear < MIN_STUDENT_START_YEAR ||
    startYear > MAX_STUDENT_START_YEAR
  ) {
    throw new BadRequestException(
      `studentStartYear must be between ${MIN_STUDENT_START_YEAR} and ${MAX_STUDENT_START_YEAR}`,
    );
  }

  const minStartDate = new Date(
    Date.UTC(
      birthDate.getUTCFullYear() + minYears,
      birthDate.getUTCMonth(),
      birthDate.getUTCDate(),
    ),
  );
  const startYearDate = new Date(Date.UTC(startYear, 11, 31));

  if (startYearDate < minStartDate) {
    throw new BadRequestException(
      `studentStartYear debe ser al menos ${minYears} años posterior a birthDate`,
    );
  }

  return startYear;
}
