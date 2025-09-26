export type Role =
  | 'student'
  | 'teacher'
  | 'preceptor'
  | 'secretary'
  | 'director'
  | 'admin';

export interface UserRow {
  id: string;
  name: string;
  lastName: string;
  cuil: string;
  role: Role;
}

export type UsersTableContext =
  | 'default'          // gestión general
  | 'subject-students' // listado de alumnos por materia (docente)
  | 'readonly';        // listados sin acciones (ej. profesor)

export interface RowAction {
  id: string;                // ej: 'view', 'cert', 'academic', 'teacher-subjects'
  label: string;
  icon: string;              // PrimeIcons
  // hint opcional para tooltip
  hint?: string;
  // si la acción está deshabilitada según otras reglas (no RBAC)
  disabled?: boolean;
}


