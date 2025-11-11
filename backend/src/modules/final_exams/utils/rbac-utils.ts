import { ROLE } from "@/shared/rbac/roles.constants";

const RANK: Record<ROLE, number> = {
  [ROLE.STUDENT]: 0,
  [ROLE.TEACHER]: 0,
  [ROLE.PRECEPTOR]: 1,
  [ROLE.SECRETARY]: 2,
  [ROLE.EXECUTIVE_SECRETARY]: 3,
};

//por si necesito partial
// const RANK: Partial<Record<ROLE, number>> = {
//   [ROLE.PRECEPTOR]: 1,
//   [ROLE.SECRETARY]: 2,
//   [ROLE.EXECUTIVE_SECRETARY]: 3,
// };

export const hasRankAtLeast = (role: ROLE, minRole: ROLE) =>
  (RANK[role] ?? 0) >= (RANK[minRole] ?? 0);
