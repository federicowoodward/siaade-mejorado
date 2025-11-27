// Severidad visual para estados de materias, alineada con PrimeNG Tag.
// Libre -> rojo (danger)
// Promocionado -> verde (success)
// Regular -> naranja (warning)
// Inscripto / No inscripto / Aprobado / otros -> gris (secondary/info)
export type SubjectStateSeverity =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'secondary';

export function resolveSubjectStateSeverity(
  condition: string | null | undefined,
): SubjectStateSeverity {
  const raw = condition ?? '';
  const value = raw.trim().toLowerCase();

  // Gris por defecto cuando no hay información clara.
  // Usamos 'secondary' porque está soportado por PrimeNG 20 (p-tag-secondary).
  // Si en alguna versión futura no estuviera disponible o rompiera tipos,
  // se puede reemplazar por 'info' como base y ajustar el color vía CSS.
  const defaultGray: SubjectStateSeverity = 'secondary';

  if (!value) {
    return defaultGray;
  }

  const isPromo = value.includes('promo') || value.includes('promocionado');
  const isLibre = value.includes('libre');
  const isRegular = value.includes('regular');
  const isAprobado = value.includes('aproba') && !isPromo;
  const isInscripto =
    value.includes('inscripto') ||
    value.includes('inscrito') ||
    value.includes('no inscripto') ||
    value.includes('no inscrito');

  // Prioridad:
  // 1) Promocionado (verde)
  // 2) Libre (rojo)
  // 3) Regular (naranja)
  // 4) Aprobado (gris)
  // 5) Inscripto / No inscripto (gris)
  // 6) Cualquier otro valor -> gris
  if (isPromo) {
    return 'success';
  }
  if (isLibre) {
    return 'danger';
  }
  if (isRegular) {
    return 'warning';
  }
  if (isAprobado) {
    return defaultGray;
  }
  if (isInscripto) {
    return defaultGray;
  }

  return defaultGray;
}

