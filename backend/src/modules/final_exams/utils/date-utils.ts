// src/modules/final_exams/utils/date-utils.ts
type Dateish = Date | string | null | undefined;

export const toDate = (d: Dateish): Date => {
  if (!d) throw new Error('Invalid date value');
  if (d instanceof Date) return d;
  // Soportar 'YYYY-MM-DD' y 'YYYY-MM-DDTHH:mm:ss'
  const raw = d.includes('T') ? d : `${d}T00:00:00`;
  const dt = new Date(raw);
  if (isNaN(dt.getTime())) throw new Error('Invalid date value');
  return dt;
};

export const stripTime = (d: Dateish): Date => {
  const dt = toDate(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
};

export const isoToDate = (iso: string): Date => toDate(iso);

export const dateInRange = (d: Dateish, start: Dateish, end: Dateish): boolean =>
  stripTime(d) >= stripTime(start) && stripTime(d) <= stripTime(end);
