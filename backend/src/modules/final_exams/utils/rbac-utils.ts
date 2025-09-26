// src/modules/final_exams/utils/rbac-utils.ts
// ranking simple para la regla de borrado "viejo"
const RANK: Record<string, number> = {
  PRECEPTOR: 1,
  SECRETARIO: 2,
  ADMIN_GENERAL: 3,
};
export const hasRankAtLeast = (role: string, minRole: keyof typeof RANK) =>
  (RANK[role] ?? 0) >= RANK[minRole];
