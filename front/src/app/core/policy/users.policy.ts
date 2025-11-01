import { ROLE } from "../auth/roles";
import { RowAction, UsersTableContext } from "../models/users-table.models";

type VisibilityMatrix = Record<ROLE, Set<ROLE>>;

const VISIBILITY: VisibilityMatrix = {
  [ROLE.STUDENT]: new Set<ROLE>([ROLE.STUDENT]),
  [ROLE.TEACHER]: new Set<ROLE>([ROLE.STUDENT, ROLE.TEACHER]),
  [ROLE.PRECEPTOR]: new Set<ROLE>([
    ROLE.STUDENT,
    ROLE.TEACHER,
    ROLE.PRECEPTOR,
    ROLE.SECRETARY,
    ROLE.EXECUTIVE_SECRETARY,
  ]),
  [ROLE.SECRETARY]: new Set<ROLE>([
    ROLE.STUDENT,
    ROLE.TEACHER,
    ROLE.PRECEPTOR,
    ROLE.SECRETARY,
    ROLE.EXECUTIVE_SECRETARY,
  ]),
  [ROLE.EXECUTIVE_SECRETARY]: new Set<ROLE>([
    ROLE.STUDENT,
    ROLE.TEACHER,
    ROLE.PRECEPTOR,
    ROLE.SECRETARY,
    ROLE.EXECUTIVE_SECRETARY,
  ]),
};

const MANAGEMENT_ACTIONS: RowAction[] = [
  { id: "view", label: "Ver usuario", icon: "pi pi-user" },
  { id: "cert", label: "Certificados", icon: "pi pi-file-pdf" },
  { id: "academic", label: "Situacion academica", icon: "pi pi-graduation-cap" },
  { id: "teacher-subjects", label: "Materias a cargo", icon: "pi pi-book" },
];

const TEACHER_ACTIONS: RowAction[] = [
  { id: "view", label: "Ver usuario", icon: "pi pi-user" },
];

export function canSee(viewer: ROLE, target: ROLE): boolean {
  return VISIBILITY[viewer]?.has(target) ?? false;
}

export function actionsFor(
  viewer: ROLE,
  target: ROLE,
  ctx: UsersTableContext
): RowAction[] {
  const base = (() => {
    if (viewer === ROLE.PRECEPTOR || viewer === ROLE.SECRETARY || viewer === ROLE.EXECUTIVE_SECRETARY) {
      return MANAGEMENT_ACTIONS;
    }
    if (viewer === ROLE.TEACHER) return TEACHER_ACTIONS;
    return [];
  })();

  let actions = [...base];

  actions = actions.filter((a) => {
    if (a.id === "academic") return target === ROLE.STUDENT;
    if (a.id === "teacher-subjects") return target === ROLE.TEACHER;
    return true;
  });

  if (ctx === "readonly") {
    actions = actions.filter((a) => a.id === "view");
  }
  if (ctx === "subject-students") {
    actions = actions.filter((a) => a.id === "view" || a.id === "academic");
  }

  return actions;
}
