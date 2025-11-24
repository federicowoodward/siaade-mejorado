import { StudentActionWindow, StudentWindowState } from '../../core/models/student-exam.model';

/**
 * Normalizes a date value to an ISO date string (YYYY-MM-DD format).
 * Handles Date objects, ISO strings with timestamps, and plain date strings.
 *
 * @param value - The date value to normalize
 * @returns The normalized date string in YYYY-MM-DD format, or empty string if invalid
 */
export function normalizeDate(
  value: string | Date | null | undefined,
): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') {
    if (value.includes('T')) return value.slice(0, 10);
    return value;
  }
  return '';
}

/**
 * Resolves the window state based on start and end dates.
 *
 * @param opensAt - The opening date in YYYY-MM-DD format
 * @param closesAt - The closing date in YYYY-MM-DD format
 * @returns The window state: 'open', 'upcoming', 'past', or 'closed'
 */
export function resolveWindowState(
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

/**
 * Normalizes a window object to a StudentActionWindow interface.
 *
 * @param window - The raw window object from the API
 * @returns A normalized StudentActionWindow object
 */
export function normalizeWindow(window: any): StudentActionWindow {
  const opensAt = normalizeDate(
    window?.opensAt ?? window?.start ?? window?.from,
  );
  const closesAt = normalizeDate(
    window?.closesAt ?? window?.end ?? window?.to,
  );
  return {
    id: window?.id ?? window?.windowId,
    label: window?.label ?? window?.name ?? 'Ventana',
    opensAt,
    closesAt,
    state: resolveWindowState(opensAt, closesAt),
    message: window?.message ?? null,
    isAdditional: Boolean(window?.isAdditional ?? window?.additional ?? false),
  };
}

/**
 * Safely converts a value to a number.
 *
 * @param value - The value to convert
 * @returns The numeric value, or null if the conversion fails
 */
export function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
