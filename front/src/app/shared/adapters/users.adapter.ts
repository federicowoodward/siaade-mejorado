import { UserRow, Role } from '../../core/models/users-table.models';

export function mapApiUserToRow(u: any, getRoleNameById: (id: number)=>Role | undefined): UserRow {
  return {
    id: u.id,
    name: u.name,
    lastName: u.lastName,
    cuil: u.cuil,
    role: (getRoleNameById(u.roleId) as Role) || 'student', // fallback sensato
  };
}
