// Severidad visual para estados de materias, alineada con PrimeNG Tag.
// Libre -> rojo (danger)
// Promocionado -> verde (success)
// Regular -> naranja (warn)
// Inscripto / No inscripto / Aprobado / otros -> gris (secondary/info)
export type SubjectStateSeverity =
  | 'success'
  | 'info'
  | 'warn'
  | 'danger'
  | 'secondary';

export function resolveSubjectStateSeverity(
  condition: string | null | undefined,
): SubjectStateSeverity {
  const raw = condition ?? '';
  const value = raw.trim().toLowerCase();
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Gris por defecto cuando no hay información clara.
  // Usamos 'secondary' porque está soportado por PrimeNG 20 (p-tag-secondary).
  // Si en alguna versión futura no estuviera disponible o rompiera tipos,
  // se puede reemplazar por 'info' como base y ajustar el color vía CSS.
  const defaultGray: SubjectStateSeverity = 'secondary';

  if (!normalized) {
    return defaultGray;
  }

  const isPromo =
    normalized.includes('promo') || normalized.includes('promocionado');
  const isLibre = normalized.includes('libre');
  const isRegular = normalized.includes('regular');
  const isAprobado =
    normalized.includes('aproba') &&
    !isPromo &&
    !normalized.includes('desaprob'); // evita clasificar "Desaprobado" como aprobado
  const isInscripto =
    normalized.includes('inscripto') ||
    normalized.includes('inscrito') ||
    normalized.includes('no inscripto') ||
    normalized.includes('no inscrito');

  // Prioridad:
  // 1) Promocionado (verde)
  // 2) Libre / Desaprobado (rojo)
  // 3) Regular (naranja)
  // 4) Aprobado (gris)
  // 5) Inscripto / No inscripto (gris)
  // 6) Cualquier otro valor -> gris
  if (isPromo) {
    return 'success';
  }
  if (isLibre || normalized.includes('desaprob')) {
    return 'danger';
  }
  if (isRegular) {
    return 'warn';
  }
  if (isAprobado) {
    return defaultGray;
  }
  if (isInscripto) {
    return defaultGray;
  }

  return defaultGray;
}
