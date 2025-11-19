import { ROLE } from '../auth/roles';

export type Role = ROLE;

export interface UserRow {
  id: string;
  name: string;
  lastName: string;
  cuil: string;
  email: string;
  role: Role;
}

export type UsersTableContext =
  | 'default' // gestion general
  | 'subject-students' // listado de alumnos por materia (docente)
  | 'readonly'; // listados sin acciones (ej. profesor)

export interface RowAction {
  id: string;
  label: string;
  icon: string;
  hint?: string;
  disabled?: boolean;
}
