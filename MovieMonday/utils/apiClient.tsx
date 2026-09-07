// Collapses duplicate concurrent requests to the same endpoint into one
// network call, and serves a short-lived cached result for repeat calls
// right after. Safe for GETs and idempotent POSTs (status checks). Do NOT
// use this for mutating calls (add-movie, create, delete, etc) — those
// should always hit the network fresh.

type FetchResult<T = any> = { ok: boolean; status: number; data: T | null };

const RESULT_CACHE_MS = 5000; // how long a completed result is reused
const SAFETY_TIMEOUT_MS = 15000; // max time an in-flight entry is trusted

const pending = new Map<string, Promise<FetchResult>>();
const resultCache = new Map<string, { result: FetchResult; expires: number }>();

function buildKey(url: string, options?: RequestInit): string {
  const method = options?.method || "GET";
  const body = typeof options?.body === "string" ? options.body : "";
  return `${method}:${url}:${body}`;
}

async function rawFetch(url: string, options?: RequestInit): Promise<FetchResult> {
  const res = await fetch(url, options);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

export async function dedupedFetch<T = any>(
  url: string,
  options?: RequestInit,
): Promise<FetchResult<T>> {
  const key = buildKey(url, options);
  const now = Date.now();

  const cached = resultCache.get(key);
  if (cached && cached.expires > now) {
    return cached.result;
  }

  let promise = pending.get(key);
  if (!promise) {
    promise = rawFetch(url, options);
    pending.set(key, promise);
    setTimeout(() => pending.delete(key), SAFETY_TIMEOUT_MS);
    promise.finally(() => pending.delete(key));
  }

  const result = await promise;
  if (result.ok && RESULT_CACHE_MS > 0) {
    resultCache.set(key, { result, expires: Date.now() + RESULT_CACHE_MS });
  }
  return result;
}