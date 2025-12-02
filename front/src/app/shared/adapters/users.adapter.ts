import { UserRow, Role } from '../../core/models/users-table.models';
import { ROLE, ROLE_BY_ID } from '../../core/auth/roles';

export function mapApiUserToRow(
  u: any,
  getRoleNameById?: (id: number) => Role | null,
): UserRow {
  const resolvedRole = resolveRole(u.roleId, getRoleNameById);
  const toBool = (value: any, fallback: boolean): boolean => {
    if (value === undefined) return fallback;
    if (value === null) return false;
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      if (trimmed === 'true') return true;
      if (trimmed === 'false') return false;
      if (!Number.isNaN(Number(trimmed))) return Number(trimmed) !== 0;
    }
    if (typeof value === 'number') return value !== 0;
    return !!value;
  };
  const rawIsActive = u?.isActive ?? (u as any)?.is_active;
  const rawIsBlocked =
    u?.isBlocked ?? (u as any)?.is_blocked ?? (u as any)?.blocked;
  const rawBlockedReason =
    u?.blockedReason ?? (u as any)?.blocked_reason ?? null;
  return {
    id: u.id,
    name: u.name,
    lastName: u.lastName,
    cuil: u.cuil,
    email: u.email || '',
    role: resolvedRole,
    isBlocked: toBool(rawIsBlocked, false),
    isActive: toBool(rawIsActive, true),
    blockedReason: rawBlockedReason,
  };
}

function resolveRole(
  roleId: number | undefined,
  getRoleNameById?: (id: number) => Role | null,
): Role {
  if (getRoleNameById) {
    const mapped = getRoleNameById(roleId ?? 0);
    if (mapped) return mapped;
  }
  if (roleId != null) {
    const byId = ROLE_BY_ID[roleId];
    if (byId) return byId;
  }
  return ROLE.STUDENT;
}
