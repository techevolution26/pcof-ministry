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

export async function apiDelete(path: string) {
  return fetchWithAuth(path, { method: 'DELETE' });
}

/** Churches */
export async function fetchChurchById(id: string | number) {
  return apiGet(`/api/admin/churches/${id}`);
}
export async function createChurch(payload: any) {
  return apiPost(`/api/admin/churches`, payload);
}
export async function updateChurch(id: string | number, payload: any) {
  return apiPut(`/api/admin/churches/${id}`, payload);
}
export async function deleteChurch(id: string | number) {
  return apiDelete(`/api/admin/churches/${id}`);
}

/** Members */
export async function fetchMemberById(id: string | number) {
  return apiGet(`/api/admin/members/${id}`);
}
export async function createMember(payload: any) {
  return apiPost(`/api/admin/members`, payload);
}
export async function updateMember(id: string | number, payload: any) {
  return apiPut(`/api/admin/members/${id}`, payload);
}
export async function deleteMember(id: string | number) {
  return apiDelete(`/api/admin/members/${id}`);
}
export async function fetchChurchesList() {
  const body = await apiGet('/api/admin/churches?per_page=100');
  // backend often returns { data: [...] } when paginated
  return Array.isArray(body) ? body : (body?.data ?? []);
}

// export async function fetchChurchById(id: string | number) {
//   return apiGet(`/api/admin/churches/${id}`);
// }

/** Lists filtered by church_id. Many admin endpoints return paginated { data: [...] } or array. */
export async function fetchChurchMembers(churchId: string | number) {
  return apiGet(`/api/admin/members?church_id=${churchId}`);
}
export async function fetchChurchAssets(churchId: string | number) {
  return apiGet(`/api/admin/assets?church_id=${churchId}`);
}
export async function fetchChurchEvents(churchId: string | number) {
  return apiGet(`/api/admin/events?church_id=${churchId}`);
}

/** Payments / collections endpoints (list + summary) */
export async function fetchChurchPayments(churchId: string | number) {
  // backend: FinanceController::payments(Request $r) -> probably /api/admin/finance/payments
  return apiGet(`/api/admin/payments?church_id=${churchId}`);
}
export async function fetchChurchFinanceSummary(churchId: string | number) {
  // backend: FinanceController::adminSummary or summary -> we used /api/admin/finance/summary earlier
  return apiGet(`/api/admin/finance/summary?church_id=${churchId}`);
}

export async function fetchAdminUsers(filter = 'all') {
  return apiGet(`/api/admin/users?filter=${encodeURIComponent(filter)}`);
}
export async function fetchAdminUser(id: string | number) {
  return apiGet(`/api/admin/users/${id}`);
}
export async function approveUser(id: string | number) {
  return apiPost(`/api/admin/users/${id}/approve`);
}
export async function revokeUser(id: string | number) {
  return apiPost(`/api/admin/users/${id}/revoke`);
}
export async function assignRoleToUser(userId: string | number, role: string) {
  return apiPost(`/api/admin/users/${userId}/roles`, { role });
}
export async function removeRoleFromUser(userId: string | number, role: string) {
  return apiDelete(`/api/admin/users/${userId}/roles/${encodeURIComponent(role)}`);
}

/* Roles endpoints */
export async function fetchRoles() { return apiGet('/api/admin/roles'); }
export async function createRole(payload: any) { return apiPost('/api/admin/roles', payload); }
export async function updateRole(id: string | number, payload: any) { return apiPut(`/api/admin/roles/${id}`, payload); }
export async function deleteRole(id: string | number) { return apiDelete(`/api/admin/roles/${id}`); }


export default { getAdminToken, setAdminToken, clearAdminToken, getAdminUser, setAdminUser, verifyAdmin, login, register, logout, apiGet, apiPost, apiPut };
