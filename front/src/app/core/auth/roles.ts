export enum ROLE {
  STUDENT = 'student',
  TEACHER = 'teacher',
  PRECEPTOR = 'preceptor',
  SECRETARY = 'secretary',
  EXECUTIVE_SECRETARY = 'executive_secretary',
}

export type VisibleRole = ROLE;
export type RoleLike = ROLE | string;

export const ROLE_VALUES: ROLE[] = Object.values(ROLE);

export const ROLE_IDS: Record<ROLE, number> = {
  [ROLE.STUDENT]: 1,
  [ROLE.TEACHER]: 2,
  [ROLE.PRECEPTOR]: 3,
  [ROLE.SECRETARY]: 4,
  [ROLE.EXECUTIVE_SECRETARY]: 5,
};

export const ROLE_BY_ID: Record<number, ROLE> = Object.entries(ROLE_IDS).reduce(
  (acc, [key, value]) => {
    acc[value] = key as ROLE;
    return acc;
  },
  {} as Record<number, ROLE>,
);

export const ROLE_LABELS: Record<ROLE, string> = {
  [ROLE.STUDENT]: 'Estudiante',
  [ROLE.TEACHER]: 'Docente',
  [ROLE.PRECEPTOR]: 'Preceptor',
  [ROLE.SECRETARY]: 'Secretario',
  [ROLE.EXECUTIVE_SECRETARY]: 'Secretario directivo',
};

export function isRole(value: unknown): value is ROLE {
  return typeof value === 'string' && (ROLE_VALUES as string[]).includes(value);
}

export function normalizeRole(value: unknown): ROLE | null {
  if (!value) return null;
  const lower = String(value).trim().toLowerCase();
  return ROLE_VALUES.find((role) => role === lower) ?? null;
}
