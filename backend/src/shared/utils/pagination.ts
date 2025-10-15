export type PageParams = { page?: number; limit?: number };
export type PageMeta = { page: number; limit: number; total: number; pages: number };

export function normalizePagination(q: PageParams, defaults: PageParams = { page: 1, limit: 20 }): { page: number; limit: number; offset: number } {
  const page = Math.max(1, Number(q.page ?? defaults.page ?? 1));
  const rawLimit = Number(q.limit ?? defaults.limit ?? 20);
  const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildPageMeta(total: number, page: number, limit: number): PageMeta {
  const pages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  return { total, page, limit, pages };
}
