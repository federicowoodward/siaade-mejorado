export enum ROLE {
  STUDENT = "student",
  TEACHER = "teacher",
  PRECEPTOR = "preceptor",
  SECRETARY = "secretary",
  EXECUTIVE_SECRETARY = "executive_secretary",
}

export const ROLE_IDS: Record<ROLE, number> = {
  [ROLE.STUDENT]: 1,
  [ROLE.TEACHER]: 2,
  [ROLE.PRECEPTOR]: 3,
  [ROLE.SECRETARY]: 4,
  [ROLE.EXECUTIVE_SECRETARY]: 5,
};

export const ROLE_BY_ID: Record<number, ROLE> = Object.entries(ROLE_IDS).reduce(
  (acc, [role, id]) => {
    acc[id] = role as ROLE;
    return acc;
  },
  {} as Record<number, ROLE>,
);

export const ROLE_VALUES: ROLE[] = Object.values(ROLE);

export type RoleLike = ROLE | string | null | undefined;

export function isRole(value: unknown): value is ROLE {
  return typeof value === "string" && (ROLE_VALUES as string[]).includes(value);
}

export function normalizeRole(value: RoleLike): ROLE | null {
  if (!value) return null;
  if (isRole(value)) return value;

  const lower = value.toString().trim().toLowerCase();
  const match = ROLE_VALUES.find((role) => role === lower);
  return match ?? null;
}

export function getRoleId(role: RoleLike): number | null {
  const normalized = normalizeRole(role);
  if (!normalized) return null;
  return ROLE_IDS[normalized];
}

export function getRoleById(roleId: number | null | undefined): ROLE | null {
  if (roleId == null) return null;
  return ROLE_BY_ID[roleId] ?? null;
}
