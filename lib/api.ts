/**
 * Centralised API helper that routes all requests to the Express backend.
 *
 * Better Auth stores the session cookie automatically (same-origin).
 * For cross-origin calls to the Express server we piggy-back the Better Auth
 * session token that the library exposes via `authClient.getSession()`.
 *
 * Usage:
 *   import { apiGet, apiPost, apiDelete } from '@/lib/api';
 *   const data = await apiGet('/profile');
 *   await apiPost('/nutrition', { name, calories, date });
 *   await apiDelete('/routines', { id });
 */

import { authClient } from './auth-client';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Token helper ─────────────────────────────────────────────────────────────

/**
 * Retrieves the current Better Auth session token.
 * Better Auth stores a signed JWT in the session; we pass it as a Bearer token
 * to the Express backend which verifies it with the shared BETTER_AUTH_SECRET.
 */
async function getBearerToken(): Promise<string | null> {
  try {
    const session = await authClient.getSession();
    // Better Auth exposes the raw token on session.data?.session?.token
    const token =
      (session as any)?.data?.session?.token ??
      (session as any)?.data?.token ??
      null;
    return token;
  } catch {
    return null;
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getBearerToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers,
  });
}

// ─── Convenience methods ──────────────────────────────────────────────────────

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await apiFetch(path, { method: 'GET' });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown
): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiDelete<T = unknown>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await apiFetch(`${path}${query}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}
