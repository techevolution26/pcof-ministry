// src/lib/adminApi.ts
const DEV_LOG = true; // set to false when done debugging

export const ADMIN_TOKEN_KEY = 'ADMIN_TOKEN';
export const ADMIN_USER_KEY = 'ADMIN_USER';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  const t = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!t) return null;
  return t.trim(); // IMPORTANT: trim to avoid whitespace/newline problems
}

export function setAdminToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token === null) localStorage.removeItem(ADMIN_TOKEN_KEY);
  else localStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

export function getAdminUser(): any | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function setAdminUser(user: any | null) {
  if (typeof window === 'undefined') return;
  if (user === null) localStorage.removeItem(ADMIN_USER_KEY);
  else localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

async function parseJsonSafe(res: Response) {
  try { return await res.json(); } catch { return null; }
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

function buildHeaders(extra?: HeadersInit) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(extra as Record<string, string> || {}),
  };
  const token = getAdminToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function fetchWithAuth(path: string, init?: RequestInit) {
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const merged: RequestInit = {
    ...init,
    headers: buildHeaders(init?.headers as HeadersInit),
    credentials: 'same-origin',
  };

  if (DEV_LOG) {
    console.debug('[api] fetch', url, merged.method ?? 'GET', merged.headers);
  }

  const res = await fetch(url, merged);

  if (DEV_LOG) {
    console.debug('[api] response', url, res.status, res.statusText);
  }

  if (res.status === 401) {
    // clear token so UI redirects to login
    clearAdminToken();
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    if (res.status === 422 && data?.errors) {
      throw { status: 422, errors: data.errors, message: data.message || 'Validation failed', response: data };
    }
    throw { status: res.status, message: data?.message || res.statusText || `Request failed (${res.status})`, response: data };
  }

  return data;
}

/** Verify token -> returns user or null */
export async function verifyAdmin(): Promise<any | null> {
  const token = getAdminToken();
  if (!token) return null;
  try {
    const data = await fetchWithAuth('/api/me', { method: 'GET' });
    const user = data?.user ?? data;
    if (user) setAdminUser(user);
    return user;
  } catch (err) {
    clearAdminToken();
    return null;
  }
}

/** Login/registration helpers */
export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'same-origin',
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    if (res.status === 422 && data?.errors) throw { status: 422, errors: data.errors, message: data.message || 'Validation failed' };
    throw { status: res.status, message: data?.message || 'Login failed', response: data };
  }
  if (data?.token) setAdminToken(String(data.token));
  if (data?.user) setAdminUser(data.user);
  return data;
}

export async function register(payload: { name?: string; email: string; password: string; role?: string }) {
  const res = await fetch(`${BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'same-origin',
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    if (res.status === 422 && data?.errors) throw { status: 422, errors: data.errors, message: data.message || 'Validation failed' };
    throw { status: res.status, message: data?.message || `Register failed (${res.status})`, response: data };
  }
  if (data?.token) setAdminToken(String(data.token));
  if (data?.user) setAdminUser(data.user);
  return data;
}

export function logout() {
  try { fetchWithAuth('/api/logout', { method: 'POST' }).catch(() => { }); } catch { }
  clearAdminToken();
}

export async function apiGet(path: string) { return fetchWithAuth(path, { method: 'GET' }); }
export async function apiPost(path: string, body?: any) { return fetchWithAuth(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); }
export async function apiPut(path: string, body?: any) { return fetchWithAuth(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); }

export async function fetchAdminSummary(): Promise<any> {
  // returns whatever /api/admin/summary returns (object)
  return apiGet('/api/admin/summary');
}

export async function fetchAdminFinanceSummary(): Promise<any> {
  // returns whatever /api/admin/finance/summary returns (object)
  return apiGet('/api/admin/finance/summary');
}

export default { getAdminToken, setAdminToken, clearAdminToken, getAdminUser, setAdminUser, verifyAdmin, login, register, logout, apiGet, apiPost, apiPut };
