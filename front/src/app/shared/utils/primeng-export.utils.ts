import { ExportCSVOptions, Table } from 'primeng/table';

type ExportParams = {
  fileName?: string;
  exportOptions?: ExportCSVOptions;
};

/** Minimal helper around PrimeNG CSV export to reuse across tables. */
export function exportPrimengCsv(
  table: Table | null | undefined,
  params?: ExportParams,
): void {
  if (!table) return;

  const { fileName, exportOptions } = params ?? {};
  const sanitizedName = fileName?.replace(/\.csv$/i, '') ?? null;
  const previousName = table.exportFilename;

  if (sanitizedName) {
    table.exportFilename = sanitizedName;
  }

  table.exportCSV(exportOptions);

  if (sanitizedName) {
    table.exportFilename = previousName;
  }
}
