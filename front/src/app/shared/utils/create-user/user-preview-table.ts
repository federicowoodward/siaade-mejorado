// src/app/shared/utils/create-user/user-preview-table.ts

/** Fila estándar para <p-table> (Campo / Valor) */
export type PreviewRow = { field: string; value: string };

export interface BuildPreviewRowsOptions {
  /**
   * Orden de secciones para aplanar primero.
   * Si no se provee, se usará el orden por defecto (user, roleExtras, user_info, common_data)
   */
  sectionOrder?: string[];
  /** Si true, ordena alfabéticamente los campos resultantes (field) */
  sortByField?: boolean;
}

/** Valor que tiene sentido renderizar en la tabla */
function isRenderable(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string' && v.trim() === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

/** Cómo mostrar valores no-objeto */
function toDisplayValue(v: unknown): string {
  if (Array.isArray(v)) return v.map((x) => toDisplayValue(x)).join(', ');
  if (typeof v === 'object' && v !== null) return ''; // objetos se expanden con flatten
  return String(v);
}

/** Aplana objetos anidados en filas {field, value}, ej: "common_data.address.street" */
function flattenPreview(obj: any, prefix = '', out: PreviewRow[] = []): PreviewRow[] {
  if (!obj || typeof obj !== 'object') return out;

  for (const [k, v] of Object.entries(obj)) {
    const keyPath = prefix ? `${prefix}.${k}` : k;

    if (v && typeof v === 'object' && !Array.isArray(v)) {
      // expandimos objetos (address, user_info, etc.)
      flattenPreview(v, keyPath, out);
      continue;
    }

    if (isRenderable(v)) {
      out.push({ field: keyPath, value: toDisplayValue(v) });
    }
  }
  return out;
}

/**
 * Construye las filas para la tabla de preview a partir del objeto de `getPreview()`.
 * Por defecto respeta el orden: user → roleExtras → user_info → common_data.
 */
export function buildPreviewRows(
  preview: {
    user?: any;
    roleExtras?: any;
    user_info?: any;
    common_data?: any;
    [k: string]: any;
  },
  opts: BuildPreviewRowsOptions = {}
): PreviewRow[] {
  const rows: PreviewRow[] = [];

  const order =
    opts.sectionOrder ??
    ['user', 'roleExtras', 'user_info', 'common_data'];

  for (const section of order) {
    if (preview?.[section]) {
      flattenPreview(preview[section], section, rows);
    }
  }

  // también soporta secciones extras no listadas explícitamente
  for (const [key, value] of Object.entries(preview || {})) {
    if (!order.includes(key) && value && typeof value === 'object') {
      flattenPreview(value, key, rows);
    }
  }

  if (opts.sortByField) {
    rows.sort((a, b) => a.field.localeCompare(b.field));
  }

  return rows;
}
