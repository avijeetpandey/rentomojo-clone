const DEFAULT_BASE = 'http://localhost:4000';

export const API_BASE = (import.meta.env.VITE_API_BASE ?? DEFAULT_BASE).replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  token?: string | null;
};

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers ?? {});
  headers.set('Accept', 'application/json');
  if (opts.body !== undefined) headers.set('Content-Type', 'application/json');
  if (opts.token) headers.set('Authorization', `Bearer ${opts.token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
      ...opts,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err) {
    throw new ApiError(0, `Network error: ${(err as Error).message}`);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && typeof (data as Record<string, unknown>).message === 'string'
        ? (data as Record<string, unknown>).message as string
        : null) ??
      res.statusText ??
      'Request failed';
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
