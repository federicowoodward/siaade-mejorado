import { HttpErrorResponse } from '@angular/common/http';

export type NormalizedApiError = {
  kind:
    | 'network'
    | 'invalid_credentials'
    | 'user_not_found'
    | 'user_blocked'
    | 'server'
    | 'unknown';
  status: number | 0;
  message: string;
  code?: string | null;
  reason?: string | null;
};

type ApiErrorShape = {
  status?: number;
  message?: string;
  code?: string;
  reason?: string | null;
  details?: any;
};

function extractMessages(payload: any): string[] {
  if (!payload) return [];
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(payload.message)) {
    return payload.message.filter(Boolean);
  }
  if (typeof payload.message === 'string') {
    return [payload.message];
  }
  if (typeof payload.error === 'string') {
    return [payload.error];
  }
  if (typeof payload.detail === 'string') {
    return [payload.detail];
  }
  return [];
}

function coercePayload(
  error: unknown,
): { payload: any; rawMessage: string | null } {
  if (!error) {
    return { payload: {}, rawMessage: null };
  }

  if (typeof error === 'string') {
    const trimmed = error.trim();
    try {
      return { payload: JSON.parse(trimmed), rawMessage: trimmed };
    } catch {
      return { payload: { message: trimmed }, rawMessage: trimmed };
    }
  }

  if (error instanceof ArrayBuffer) {
    try {
      const text = new TextDecoder().decode(error);
      const trimmed = text.trim();
      return { payload: JSON.parse(trimmed), rawMessage: trimmed };
    } catch {
      return { payload: {}, rawMessage: null };
    }
  }

  return { payload: error, rawMessage: null };
}

function normalizeFromPayload(
  status: number,
  payloadSource: any,
  fallbackMessage: string | null,
): NormalizedApiError {
  if (status === 0) {
    return {
      kind: 'network',
      status: 0,
      message: 'No se pudo conectar al servidor',
    };
  }

  const { payload, rawMessage } = coercePayload(payloadSource ?? {});
  const details = payload?.details ?? null;
  const code: string | null = payload?.code ?? details?.code ?? null;
  const reason: string | null = payload?.reason ?? details?.reason ?? null;
  const messages = [
    ...extractMessages(details),
    ...extractMessages(payload),
  ];
  const fallbackMsg =
    messages[0] || rawMessage || fallbackMessage || 'Error desconocido';
  const resolvedMessage = messages[0] || fallbackMsg;

  const respond = (
    kind: NormalizedApiError['kind'],
    overrideStatus?: number,
  ): NormalizedApiError => ({
    kind,
    status: overrideStatus ?? status,
    message: resolvedMessage,
    code,
    reason,
  });

  if (code) {
    switch (code) {
      case 'INVALID_CREDENTIALS':
        return respond('invalid_credentials', status || 401);
      case 'USER_NOT_FOUND':
        return respond('user_not_found', status || 404);
      case 'USER_BLOCKED':
        return respond('user_blocked', status || 423);
    }
  }

  switch (status) {
    case 401:
      return respond('invalid_credentials', 401);
    case 404:
      return respond('user_not_found', 404);
    case 423:
      return respond('user_blocked', 423);
    case 403:
      return respond('user_blocked', 403);
    default:
      if (status >= 500) {
        return respond('server');
      }
      return respond('unknown');
  }
}

function isApiErrorShape(err: unknown): err is ApiErrorShape {
  return (
    !!err &&
    typeof err === 'object' &&
    ('status' in (err as any) || 'message' in (err as any))
  );
}

export function normalizeApiError(err: unknown): NormalizedApiError {
  if (err instanceof HttpErrorResponse) {
    return normalizeFromPayload(err.status, err.error, err.message);
  }

  if (isApiErrorShape(err)) {
    const status =
      typeof err.status === 'number' && Number.isFinite(err.status)
        ? err.status
        : 0;
    const payloadSource =
      err.details !== undefined ? { ...err, details: err.details } : err;
    return normalizeFromPayload(status, payloadSource, err.message ?? null);
  }

  return { kind: 'unknown', status: 0, message: 'Error desconocido' };
}
