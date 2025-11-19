import { ROLE } from "./roles.constants";

/**
 * Placeholder RBAC policy table. Populate with module.action -> allowed roles as the
 * product evolves. Guards rely primarily on explicit @AllowRoles decorators, while this
 * object offers a central registry for cross-cutting checks or documentation.
 */
export const RBAC_POLICY: Record<string, ROLE[]> = {};

export function isRoleAllowed(action: string, role: ROLE | null): boolean {
  if (!action) return true;
  const allowlist = RBAC_POLICY[action];
  if (!allowlist || allowlist.length === 0) return true;
  if (!role) return false;
  return allowlist.includes(role);
}
