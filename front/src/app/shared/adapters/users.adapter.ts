import { UserRow, Role } from "../../core/models/users-table.models";
import { ROLE, ROLE_BY_ID } from "../../core/auth/roles";

export function mapApiUserToRow(
  u: any,
  getRoleNameById?: (id: number) => Role | null
): UserRow {
  const resolvedRole = resolveRole(u.roleId, getRoleNameById);
  return {
    id: u.id,
    name: u.name,
    lastName: u.lastName,
    cuil: u.cuil,
    email: u.email || '',
    role: resolvedRole,
  };
}

function resolveRole(
  roleId: number | undefined,
  getRoleNameById?: (id: number) => Role | null
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
