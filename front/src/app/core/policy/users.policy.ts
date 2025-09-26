import { Role, RowAction, UsersTableContext } from '../models/users-table.models';

type VisibilityMatrix = Record<Role, Set<Role>>;

// Quien LISTA a quién (incluye verse a sí mismo)
const VISIBILITY: VisibilityMatrix = {
  student:   new Set<Role>(['student']), // se usa poco acá, pero dejamos coherente
  teacher:   new Set<Role>(['student', 'teacher']), // como listado en sus materias
  preceptor: new Set<Role>(['student', 'teacher', 'preceptor', 'secretary']), // NO director
  secretary: new Set<Role>(['student', 'teacher', 'preceptor', 'secretary']), // NO director
  director:  new Set<Role>(['student', 'teacher', 'preceptor', 'secretary', 'director']), // todos
  admin:     new Set<Role>(['student', 'teacher', 'preceptor', 'secretary', 'director', 'admin']),
};

// Qué ACCIONES puede ejecutar quien mira (sobre una fila X targetRole)
const ADMIN_ACTIONS: RowAction[] = [
  { id: 'view', label: 'Ver usuario', icon: 'pi pi-user' },
  { id: 'cert', label: 'Certificados', icon: 'pi pi-file-pdf' },
  { id: 'academic', label: 'Situación académica', icon: 'pi pi-graduation-cap' },
  { id: 'teacher-subjects', label: 'Materias a cargo', icon: 'pi pi-book' },
];

const PRECEPTOR_SECRETARY_ACTIONS: RowAction[] = [
  { id: 'view', label: 'Ver usuario', icon: 'pi pi-user' },
  { id: 'cert', label: 'Certificados', icon: 'pi pi-file-pdf' },
  { id: 'academic', label: 'Situación académica', icon: 'pi pi-graduation-cap' },
  { id: 'teacher-subjects', label: 'Materias a cargo', icon: 'pi pi-book' },
];

const DIRECTOR_ACTIONS: RowAction[] = [
  { id: 'view', label: 'Ver usuario', icon: 'pi pi-user' },
  { id: 'cert', label: 'Certificados', icon: 'pi pi-file-pdf' },
  { id: 'academic', label: 'Situación académica', icon: 'pi pi-graduation-cap' },
  { id: 'teacher-subjects', label: 'Materias a cargo', icon: 'pi pi-book' },
];

const TEACHER_ACTIONS_READONLY: RowAction[] = [
  { id: 'view', label: 'Ver usuario', icon: 'pi pi-user' }, // opcional, puede ser solo rowClick
];

export function canSee(viewer: Role, target: Role): boolean {
  return VISIBILITY[viewer]?.has(target) ?? false;
}

export function actionsFor(viewer: Role, target: Role, ctx: UsersTableContext): RowAction[] {
  // Contexto puede recortar acciones
  const base = (() => {
    if (viewer === 'admin') return ADMIN_ACTIONS;
    if (viewer === 'director') return DIRECTOR_ACTIONS;
    if (viewer === 'preceptor' || viewer === 'secretary') return PRECEPTOR_SECRETARY_ACTIONS;
    if (viewer === 'teacher') return TEACHER_ACTIONS_READONLY;
    return []; // students & otros: sin acciones
  })();

  let actions = [...base];

  // Si el target es 'student' mostrar academic, si 'teacher' mostrar teacher-subjects, etc.
  actions = actions.filter(a => {
    if (a.id === 'academic') return target === 'student';
    if (a.id === 'teacher-subjects') return target === 'teacher';
    return true; // 'view', 'cert' siempre
  });

  // Ajustes por contexto
  if (ctx === 'readonly') {
    actions = actions.filter(a => a.id === 'view'); // ejemplo: solo ver
  }
  if (ctx === 'subject-students') {
    // vista del docente recorriendo alumnos de su materia: solo 'view' + 'academic'
    actions = actions.filter(a => a.id === 'view' || a.id === 'academic');
  }

  // Regla especial de tu caso: “acciones de admin” visibles para preceptor/secretario/director
  // Ya contemplado arriba porque base ≈ admin-like; si en el futuro agregás acciones 100% admin,
  // etiquétalas distinto (e.g. id: 'admin-only-x') y filtrás aquí por viewer !== 'admin'.

  return actions;
}
