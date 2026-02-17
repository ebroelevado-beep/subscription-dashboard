/**
 * Shared client-side fetch helper for all hooks.
 * Unwraps the standard `{ ok, data, error }` envelope used by every API route.
 */

interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  error?: string;
}

export async function fetchApi<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  const json: ApiEnvelope<T> = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error ?? "Request failed");
  return json.data;
}
