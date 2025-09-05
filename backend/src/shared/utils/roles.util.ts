// Utilidades para normalizar roles y verificar jerarquía

export type CanonicalRole = 'ADMIN_GENERAL' | 'SECRETARIO' | 'SECRETARIO_DIRECTIVO' | 'PRECEPTOR' | 'DOCENTE' | 'ALUMNO';

// Mapea nombres de BD y variantes a nombres canónicos de negocio
export function toCanonicalRole(dbRoleName?: string, opts?: { isDirective?: boolean }): CanonicalRole | undefined {
  if (!dbRoleName) return undefined;
  const name = dbRoleName.toLowerCase();
  // Aceptar nombres ya canónicos
  if (name === 'secretario_directivo') return 'SECRETARIO_DIRECTIVO';
  if (name === 'admin_general') return 'ADMIN_GENERAL';
  if (name === 'secretario') return 'SECRETARIO';
  if (name === 'preceptor') return 'PRECEPTOR';
  if (name === 'docente') return 'DOCENTE';
  if (name === 'alumno') return 'ALUMNO';
  if (name === 'secretary' || name === 'secretario' || name === 'admin_general') {
    if (opts?.isDirective) return 'SECRETARIO_DIRECTIVO';
    // Si en algún lugar llaman ADMIN_GENERAL como rol directo
    if (name === 'admin_general') return 'ADMIN_GENERAL';
    return 'SECRETARIO';
  }
  if (name === 'teacher' || name === 'docente' || name === 'profesor') return 'DOCENTE';
  if (name === 'preceptor') return 'PRECEPTOR';
  if (name === 'student' || name === 'alumno') return 'ALUMNO';
  return undefined;
}

// Permite comparar contra decoradores que podrían venir en ES/EN o distintos formatos
export function normalizeRequiredRoles(required: string[]): CanonicalRole[] {
  const set = new Set<CanonicalRole>();
  for (const r of required) {
    const key = r.trim().toUpperCase();
    switch (key) {
  case 'ADMIN_GENERAL':
  case 'ADMINISTRADOR':
  case 'ADMIN':
        set.add('ADMIN_GENERAL');
        break;
      case 'SECRETARIO_DIRECTIVO':
      case 'SECRETARIA_DIRECTIVA':
        set.add('SECRETARIO_DIRECTIVO');
        break;
      case 'SECRETARIO':
      case 'SECRETARY':
        set.add('SECRETARIO');
        break;
      case 'PRECEPTOR':
        set.add('PRECEPTOR');
        break;
      case 'DOCENTE':
      case 'PROFESOR':
      case 'TEACHER':
        set.add('DOCENTE');
        break;
      case 'ALUMNO':
      case 'STUDENT':
        set.add('ALUMNO');
        break;
      default:
        // ignorar desconocidos
        break;
    }
  }
  return Array.from(set);
}

export function roleSatisfies(userRole: CanonicalRole, required: CanonicalRole[]): boolean {
  if (required.length === 0) return true;
  if (required.includes(userRole)) return true;
  // ADMIN_GENERAL cumple todo
  if (userRole === 'ADMIN_GENERAL' || userRole === 'SECRETARIO_DIRECTIVO') {
    return true;
  }
  return false;
}
