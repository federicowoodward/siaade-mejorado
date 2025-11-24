/**
 * Shared date and time utility functions for the backend.
 * Centralizes common date manipulation patterns used across services.
 */

export type WindowState = "open" | "upcoming" | "closed" | "past";

/**
 * Formats a date to ISO date string (YYYY-MM-DD format).
 *
 * @param value - The date value to format
 * @returns The formatted date string, or empty string if invalid
 */
export function formatDate(
  value: Date | string | null | undefined,
): string {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Converts a Date value to ISO date string (YYYY-MM-DD format) or null.
 * Useful for API response serialization.
 *
 * @param value - The date value to convert
 * @returns The ISO date string, or null if invalid
 */
export function toIsoDate(
  value: Date | string | null | undefined,
): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.length >= 10) {
    return value.includes("T") ? value.slice(0, 10) : value;
  }
  return null;
}

/**
 * Resolves the window state based on start and end dates.
 *
 * @param opensAt - The opening date (YYYY-MM-DD format or parseable date string)
 * @param closesAt - The closing date (YYYY-MM-DD format or parseable date string)
 * @returns The window state: 'open', 'upcoming', 'past', or 'closed'
 */
export function resolveWindowState(
  opensAt?: string | null,
  closesAt?: string | null,
): WindowState {
  if (!opensAt || !closesAt) {
    return "closed";
  }
  const start = Date.parse(opensAt);
  const end = Date.parse(closesAt);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "closed";
  }
  const now = Date.now();
  if (now < start) {
    return "upcoming";
  }
  if (now > end) {
    return "past";
  }
  return "open";
}

/**
 * Safely converts a value to a number.
 *
 * @param value - The value to convert
 * @param fallback - Optional fallback value if conversion fails. If not provided, returns null on failure.
 * @returns The numeric value, or the fallback/null if conversion fails
 */
export function toNumber(value: unknown): number | null;
export function toNumber(value: unknown, fallback: number): number;
export function toNumber(value: unknown, fallback?: number): number | null {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  return fallback !== undefined ? fallback : null;
}
