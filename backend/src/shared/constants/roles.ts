import { CanonicalRole } from "../utils/roles.util";

export const ROLE_NAMES = {
  SECRETARIO_DIRECTIVO: "secretario_directivo",
  SECRETARIO: "secretario",
  PRECEPTOR: "preceptor",
  PROFESOR: "profesor",
  ALUMNO: "alumno",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

export const ALL_ROLE_NAMES: RoleName[] = Object.values(ROLE_NAMES);

export const CANONICAL_TO_ROLE: Partial<Record<CanonicalRole, RoleName>> = {
  SECRETARIO_DIRECTIVO: ROLE_NAMES.SECRETARIO_DIRECTIVO,
  SECRETARIO: ROLE_NAMES.SECRETARIO,
  PRECEPTOR: ROLE_NAMES.PRECEPTOR,
  DOCENTE: ROLE_NAMES.PROFESOR,
  ALUMNO: ROLE_NAMES.ALUMNO,
};

