export function buildCacheKey(
  method: string,
  fullUrl: string,
  paramsObj: Record<string, any>,
  token?: string | null,
): string {
  // Normalizamos params en orden alfabético para evitar claves distintas por orden
  const qp = new URLSearchParams();
  Object.keys(paramsObj ?? {})
    .sort()
    .forEach((k) => {
      const v = paramsObj[k];
      if (v !== undefined && v !== null) qp.append(k, String(v));
    });

  const tokenSig = token ? `#tk:${token.slice(0, 12)}` : '#tk:none';
  return `${method}:${fullUrl}?${qp.toString()}${tokenSig}`;
}

export function shortPathFrom(fullUrl: string): string {
  try {
    const u = new URL(fullUrl);
    return `${u.pathname}${u.search ? `?${u.searchParams.toString()}` : ''}`;
  } catch {
    return fullUrl;
  }
}

export function logCacheHit(method: string, fullUrl: string) {
  const short = shortPathFrom(fullUrl);
  console.groupCollapsed(`[CACHE ✅] ${method} ${short} (TTL 10m)`);
  console.log('Fuente:', 'IndexedDB');
  console.groupEnd();
}
