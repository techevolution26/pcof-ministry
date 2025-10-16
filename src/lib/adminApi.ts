// src/lib/adminApi.ts
/* eslint-disable no-console */
/**
 * Typed admin API helpers.
 * - Avoids `any` usage (uses `unknown`, generics, or Record<string, unknown>).
 * - Provides fetchWithAuth and public fetch helpers.
 * - Implements ensureCsrf + apiPost({ useCsrf: true }) for Laravel Sanctum SPA flow.
 *
 * IMPORTANT: This file preserves behavior expected by the rest of your app:
 * errors thrown for 422 include `{ status: 422, errors: {...}, message }`
 * other errors include `{ status, message, response }`.
 */

const DEV_LOG = true; // set to false when done debugging

export const ADMIN_TOKEN_KEY = 'ADMIN_TOKEN';
export const ADMIN_USER_KEY = 'ADMIN_USER';

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

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

export function getAdminUser(): unknown | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function setAdminUser(user: unknown | null) {
  if (typeof window === 'undefined') return;
  if (user === null) localStorage.removeItem(ADMIN_USER_KEY);
  else localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

async function parseJsonSafe(res: Response): Promise<unknown | null> {
  try { return await res.json(); } catch { return null; }
}

/**
 * Ensure a CSRF cookie exists for Laravel Sanctum SPA flow.
 * Call before POST/PUT/PATCH/DELETE when using session cookies.
 */
export async function ensureCsrf(): Promise<void> {
  // If no BASE configured, skip
  if (!BASE) return;
  try {
    await fetch(`${BASE}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
    });
  } catch (e) {
    // best-effort; swallow errors (server might not require csrf)
    if (DEV_LOG) console.debug('ensureCsrf failed', e);
  }
}

/**
 * Low level helper to build headers
 */
function buildHeaders(extra?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(extra as Record<string, string> || {}),
  };
  const token = getAdminToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** Build absolute URL from path or return full URL if provided */
function buildUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Generic fetch wrapper with auth headers included.
 * Returns parsed JSON (or null) or throws structured error objects.
 */
async function fetchWithAuth<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path);
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
    // validation error
    if (res.status === 422 && data && typeof data === 'object' && 'errors' in (data as object)) {
      // keep existing UI expectation: throw object with { status: 422, errors, message, response }
      throw {
        status: 422,
        errors: (data as Record<string, unknown>).errors ?? {},
        message: (data as Record<string, unknown>).message ?? 'Validation failed',
        response: data,
      };
    }

    throw {
      status: res.status,
      message: (data && typeof data === 'object' && 'message' in (data as object))
        ? (data as Record<string, unknown>).message
        : (typeof data === 'string' ? data : res.statusText || `Request failed (${res.status})`),
      response: data,
    };
  }

  return data as T;
}

/**
 * apiPost wrapper supporting optional CSRF step
 */
export async function apiPost<T = unknown, B = unknown>(path: string, body?: B, opts?: { useCsrf?: boolean }): Promise<T> {
  if (opts?.useCsrf) {
    await ensureCsrf();
  }
  return fetchWithAuth<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiGet<T = unknown>(path: string): Promise<T> { return fetchWithAuth<T>(path, { method: 'GET' }); }
export async function apiPut<T = unknown, B = unknown>(path: string, body?: B): Promise<T> {
  return fetchWithAuth<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}
export async function apiDelete<T = unknown>(path: string): Promise<T> { return fetchWithAuth<T>(path, { method: 'DELETE' }); }

/**
 * createUser convenience wrapper - uses CSRF to support Sanctum SPA flow.
 * Normalizes returned/ thrown shapes to match existing UI expectations.
 */
export async function createUser(payload: {
  name: string
  email: string
  password: string
  roles?: string[]
  church_id?: number | string | null
}): Promise<unknown> {
  try {
    return await apiPost('/api/admin/users', payload, { useCsrf: true });
  } catch (err: unknown) {
    // preserve structured 422 or rethrow
    if (err && typeof err === 'object' && 'status' in (err as object) && (err as any).status === 422 && 'errors' in (err as object)) {
      throw err;
    }
    throw err;
  }
}

/** Verify token -> returns user or null */
export async function verifyAdmin(): Promise<unknown | null> {
  const token = getAdminToken();
  if (!token) return null;
  try {
    const data = await fetchWithAuth('/api/me', { method: 'GET' });
    const user = (data && typeof data === 'object' && 'user' in (data as object)) ? (data as Record<string, unknown>).user : data;
    if (user) setAdminUser(user);
    return user ?? null;
  } catch (err) {
    clearAdminToken();
    return null;
  }
}

/** Login/registration helpers */
export async function login(email: string, password: string) {
  const res = await fetch(buildUrl('/api/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'same-origin',
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    if (res.status === 422 && data && typeof data === 'object' && 'errors' in (data as object)) {
      throw { status: 422, errors: (data as Record<string, unknown>).errors, message: (data as Record<string, unknown>).message ?? 'Validation failed', response: data };
    }
    throw { status: res.status, message: (data && typeof data === 'object' && 'message' in (data as object)) ? (data as Record<string, unknown>).message : 'Login failed', response: data };
  }
  if (data && typeof data === 'object' && 'token' in (data as object)) setAdminToken(String((data as Record<string, unknown>).token));
  if (data && typeof data === 'object' && 'user' in (data as object)) setAdminUser((data as Record<string, unknown>).user);
  return data;
}

export async function register(payload: { name?: string; email: string; password: string; role?: string }) {
  const res = await fetch(buildUrl('/api/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'same-origin',
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    if (res.status === 422 && data && typeof data === 'object' && 'errors' in (data as object)) {
      throw { status: 422, errors: (data as Record<string, unknown>).errors, message: (data as Record<string, unknown>).message ?? 'Validation failed', response: data };
    }
    throw { status: res.status, message: (data && typeof data === 'object' && 'message' in (data as object)) ? (data as Record<string, unknown>).message : `Register failed (${res.status})`, response: data };
  }
  if (data && typeof data === 'object' && 'token' in (data as object)) setAdminToken(String((data as Record<string, unknown>).token));
  if (data && typeof data === 'object' && 'user' in (data as object)) setAdminUser((data as Record<string, unknown>).user);
  return data;
}

export function logout(): void {
  try { fetchWithAuth('/api/logout', { method: 'POST' }).catch(() => { }); } catch { /* noop */ }
  clearAdminToken();
}

/** Admin summary */
export async function fetchAdminSummary(): Promise<unknown> {
  return apiGet('/api/admin/summarized');
}

/** Churches */
export async function fetchChurchById(id: string | number) {
  return apiGet(`/api/admin/churches/${id}`);
}
export async function fetchChurches() {
  return apiGet('/api/admin/churches');
}
export async function createChurch(payload: Record<string, unknown>) {
  return apiPost('/api/admin/churches', payload);
}
export async function updateChurch(id: string | number, payload: Record<string, unknown>) {
  return apiPut(`/api/admin/churches/${id}`, payload);
}
export async function deleteChurch(id: string | number) {
  return apiDelete(`/api/admin/churches/${id}`);
}

/** Members */
export async function fetchMemberById(id: string | number) {
  return apiGet(`/api/admin/members/${id}`);
}
export async function createMember(payload: Record<string, unknown>) {
  return apiPost('/api/admin/members', payload);
}
export async function updateMember(id: string | number, payload: Record<string, unknown>) {
  return apiPut(`/api/admin/members/${id}`, payload);
}
export async function deleteMember(id: string | number) {
  return apiDelete(`/api/admin/members/${id}`);
}
export async function fetchChurchesList() {
  const body = await apiGet('/api/admin/churches?per_page=100');
  // backend often returns { data: [...] } when paginated
  return Array.isArray(body) ? body : ((body && (body as Record<string, unknown>).data) ?? []);
}

/** Church assets / events */
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

export async function fetchChurchFinanceSummary(churchId?: string | number) {
  if (!churchId) return null;
  return apiGet(`/api/admin/churches/${churchId}/finance-summary`);
}

/** Users */
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
export async function createRole(payload: Record<string, unknown>) { return apiPost('/api/admin/roles', payload); }
export async function updateRole(id: string | number, payload: Record<string, unknown>) { return apiPut(`/api/admin/roles/${id}`, payload); }
export async function deleteRole(id: string | number) { return apiDelete(`/api/admin/roles/${id}`); }

/* Events (JSON and FormData flows) */
export async function fetchAdminEvents(params: { q?: string; church_id?: string | number; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', String(params.q));
  if (params.church_id) qs.set('church_id', String(params.church_id));
  if (params.page) qs.set('page', String(params.page));
  const path = `/api/admin/events${qs.toString() ? `?${qs.toString()}` : ''}`;
  return apiGet(path);
}

export async function fetchAdminEventById(id: string | number) {
  return apiGet(`/api/admin/events/${id}`);
}

export async function deleteAdminEvent(id: string | number) {
  return fetchWithAuth(`/api/admin/events/${id}`, { method: 'DELETE' });
}

/** Create/update events (JSON) */
export async function createAdminEvent(payload: Record<string, unknown>) {
  return apiPost('/api/admin/events', payload);
}
export async function updateAdminEvent(id: string | number, payload: Record<string, unknown>) {
  return apiPut(`/api/admin/events/${id}`, payload);
}

/** Create event with FormData (supports file) */
export async function createAdminEventFormData(form: Record<string, unknown>, imageFile?: File | null) {
  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === 'string' && v.trim() === '') return;

    if (typeof v === 'boolean') {
      fd.append(k, v ? '1' : '0');
      return;
    }

    if (typeof v === 'object' && !(v instanceof File) && !Array.isArray(v)) {
      try { fd.append(k, JSON.stringify(v)); } catch { fd.append(k, String(v)); }
      return;
    }

    if (Array.isArray(v)) {
      v.forEach(item => fd.append(`${k}[]`, typeof item === 'object' ? JSON.stringify(item) : String(item)));
      return;
    }

    fd.append(k, String(v));
  });
  if (imageFile) fd.append('image', imageFile);
  return fetchWithAuth('/api/admin/events', { method: 'POST', body: fd });
}

/** Update event with FormData (POST + _method=PUT) */
export async function updateAdminEventFormData(id: string | number, form: Record<string, unknown>, imageFile?: File | null) {
  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === 'string' && v.trim() === '') return;

    if (typeof v === 'boolean') {
      fd.append(k, v ? '1' : '0');
      return;
    }

    if (typeof v === 'object' && !(v instanceof File) && !Array.isArray(v)) {
      try { fd.append(k, JSON.stringify(v)); } catch { fd.append(k, String(v)); }
      return;
    }

    if (Array.isArray(v)) {
      v.forEach(item => fd.append(`${k}[]`, typeof item === 'object' ? JSON.stringify(item) : String(item)));
      return;
    }

    fd.append(k, String(v));
  });
  if (imageFile) fd.append('image', imageFile);
  fd.append('_method', 'PUT');
  return fetchWithAuth(`/api/admin/events/${id}`, { method: 'POST', body: fd });
}

/* Assemblies */
export async function fetchAssemblies(params: { q?: string; church_id?: string | number } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', String(params.q));
  if (params.church_id) qs.set('church_id', String(params.church_id));
  const path = `/api/admin/assemblies${qs.toString() ? `?${qs.toString()}` : ''}`;
  return apiGet(path);
}
export async function fetchAssemblyById(id: string | number) { return apiGet(`/api/admin/assemblies/${id}`); }
export async function createAssembly(payload: Record<string, unknown>) { return apiPost('/api/admin/assemblies', payload); }
export async function updateAssembly(id: string | number, payload: Record<string, unknown>) { return apiPut(`/api/admin/assemblies/${id}`, payload); }
export async function deleteAssembly(id: string | number) { return apiDelete(`/api/admin/assemblies/${id}`); }

/* Departments */
export async function fetchDepartments(params: { q?: string; church_id?: string | number; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', String(params.q));
  if (params.church_id) qs.set('church_id', String(params.church_id));
  if (params.page) qs.set('page', String(params.page));
  const path = `/api/admin/departments${qs.toString() ? `?${qs.toString()}` : ''}`;
  return apiGet(path);
}
export async function fetchDepartmentsList(params?: { church_id?: string | number }) {
  const qs = new URLSearchParams();
  qs.set('per_page', '100');
  if (params?.church_id) qs.set('church_id', String(params.church_id));
  const url = `/api/admin/departments?${qs.toString()}`;
  const body = await apiGet(url);
  return Array.isArray(body) ? body : ((body && (body as Record<string, unknown>).data) ?? []);
}
export async function fetchDepartmentById(id: string | number) { return apiGet(`/api/admin/departments/${id}`); }
export async function createDepartment(payload: Record<string, unknown>) { return apiPost('/api/admin/departments', payload); }
export async function updateDepartment(id: string | number, payload: Record<string, unknown>) { return apiPut(`/api/admin/departments/${id}`, payload); }
export async function deleteDepartment(id: string | number) { return apiDelete(`/api/admin/departments/${id}`); }

/* Designations */
export async function fetchDesignations() { return apiGet('/api/admin/designations'); }
export async function fetchDesignationById(id: string | number) { return apiGet(`/api/admin/designations/${id}`); }
export async function createDesignation(payload: Record<string, unknown>) { return apiPost('/api/admin/designations', payload); }
export async function updateDesignation(id: string | number, payload: Record<string, unknown>) { return apiPut(`/api/admin/designations/${id}`, payload); }
export async function deleteDesignation(id: string | number) { return apiDelete(`/api/admin/designations/${id}`); }
export async function fetchDesignationsList() {
  const body = await apiGet('/api/admin/designations?per_page=100');
  return Array.isArray(body) ? body : ((body && (body as Record<string, unknown>).data) ?? []);
}

/* Ministers */
export async function fetchMinisters(params: { q?: string; church_id?: string | number; department_id?: string | number; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', String(params.q));
  if (params.church_id) qs.set('church_id', String(params.church_id));
  if (params.department_id) qs.set('department_id', String(params.department_id));
  if (params.page) qs.set('page', String(params.page));
  return apiGet(`/api/admin/ministers${qs.toString() ? `?${qs.toString()}` : ''}`);
}
export async function fetchMinisterById(id: string | number) { return apiGet(`/api/admin/ministers/${id}`); }
export async function createMinister(payload: Record<string, unknown>) { return apiPost('/api/admin/ministers', payload); }
export async function updateMinister(id: string | number, payload: Record<string, unknown>) { return apiPut(`/api/admin/ministers/${id}`, payload); }
export async function deleteMinister(id: string | number) { return apiDelete(`/api/admin/ministers/${id}`); }

/* Members search for typeahead */
export async function searchMembers(q = '', per_page = 10) {
  const qs = new URLSearchParams();
  if (q) qs.set('q', String(q));
  qs.set('per_page', String(per_page));
  const path = `/api/admin/members${qs.toString() ? `?${qs.toString()}` : ''}`;
  const body = await apiGet(path);
  return Array.isArray(body) ? body : ((body && (body as Record<string, unknown>).data) ?? []);
}

/** Public (no-auth) API: fetch churches for typeahead (not admin-only) */
export async function fetchPublicChurches(params: { q?: string; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', String(params.q));
  if (params.limit) qs.set('limit', String(params.limit));
  const url = `/api/churches${qs.toString() ? `?${qs.toString()}` : ''}`;
  const full = url.startsWith('http') ? url : `${BASE}${url.startsWith('/') ? url : `/${url}`}`;
  const res = await fetch(full, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw { status: res.status, message: body && typeof body === 'object' && 'message' in (body as object) ? (body as Record<string, unknown>).message : res.statusText, response: body };
  return Array.isArray(body) ? body : ((body && (body as Record<string, unknown>).data) ?? []);
}

/* Assets */
export async function fetchAssets(params: { q?: string; church_id?: string | number; page?: number; per_page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', String(params.q));
  if (params.church_id) qs.set('church_id', String(params.church_id));
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const path = `/api/admin/assets${qs.toString() ? `?${qs.toString()}` : ''}`;
  return apiGet(path);
}
export async function fetchAssetById(id: string | number) { return apiGet(`/api/admin/assets/${id}`); }
export async function deleteAsset(id: string | number) { return apiDelete(`/api/admin/assets/${id}`); }
export async function createAdminAsset(payload: Record<string, unknown>) { return apiPost('/api/admin/assets', payload); }
export async function updateAdminAsset(id: string | number, payload: Record<string, unknown>) { return apiPut(`/api/admin/assets/${id}`, payload); }
export async function createAdminAssetFormData(form: Record<string, unknown>, file?: File | null) {
  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === 'object' && !(v instanceof File) && !Array.isArray(v)) {
      fd.append(k, JSON.stringify(v));
    } else {
      fd.append(k, String(v));
    }
  });
  if (file) fd.append('file', file);
  return fetchWithAuth('/api/admin/assets', { method: 'POST', body: fd });
}
export async function updateAdminAssetFormData(id: string | number, form: Record<string, unknown>, file?: File | null) {
  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === 'object' && !(v instanceof File) && !Array.isArray(v)) {
      fd.append(k, JSON.stringify(v));
    } else {
      fd.append(k, String(v));
    }
  });
  if (file) fd.append('file', file);
  fd.append('_method', 'PUT');
  return fetchWithAuth(`/api/admin/assets/${id}`, { method: 'POST', body: fd });
}

/* Finance helpers (payments/tithes/etc.) */
export async function fetchPayments(params: { q?: string; church_id?: string | number; page?: number; per_page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', String(params.q));
  if (params.church_id) qs.set('church_id', String(params.church_id));
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 30));
  const path = `/api/admin/finance/payments${qs.toString() ? `?${qs.toString()}` : ''}`;
  return apiGet(path);
}
export async function createPayment(payload: Record<string, unknown>) { return apiPost('/api/admin/finance/payments', payload); }
export async function fetchTithes(params: { church_id?: string | number; page?: number; per_page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.church_id) qs.set('church_id', String(params.church_id));
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 30));
  const path = `/api/admin/finance/tithes${qs.toString() ? `?${qs.toString()}` : ''}`;
  return apiGet(path);
}
export async function createTithe(payload: Record<string, unknown>) { return apiPost('/api/admin/finance/tithes', payload); }
export async function fetchAdminFinanceSummary(churchId?: string | number) {
  const qs = new URLSearchParams();
  if (churchId) qs.set('church_id', String(churchId));
  return apiGet(`/api/admin/finance/summary${qs.toString() ? `?${qs.toString()}` : ''}`);
}
export async function fetchChurchSummary(churchId: string | number, params: { days?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.days) qs.set('days', String(params.days));
  const path = `/api/admin/churches/${churchId}/summary${qs.toString() ? `?${qs.toString()}` : ''}`;
  return apiGet(path);
}

/** Ministers list helper */
export async function fetchMinistersList(params: { q?: string; church_id?: string | number; per_page?: number } = {}) {
  const qs = new URLSearchParams();
  qs.set('per_page', String(params.per_page ?? 100));
  if (params.q) qs.set('q', String(params.q));
  if (params.church_id) qs.set('church_id', String(params.church_id));
  const body = await apiGet(`/api/admin/ministers?${qs.toString()}`);
  return Array.isArray(body) ? body : ((body && (body as Record<string, unknown>).data) ?? []);
}

/** Members (paginated, scoped by church_id optionally) */
export async function fetchChurchMembers(params: { church_id?: string | number; q?: string; page?: number; per_page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.church_id) qs.set('church_id', String(params.church_id));
  if (params.q) qs.set('q', String(params.q));
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 25));
  const path = `/api/admin/members${qs.toString() ? `?${qs.toString()}` : ''}`;
  return apiGet(path);
}

/** Approve/Reject payments */
export async function approvePayment(paymentId: string | number) {
  return apiPost(`/api/admin/finance/payments/${paymentId}/approve`);
}
export async function rejectPayment(paymentId: string | number, payload: { reason?: string } = {}) {
  return apiPost(`/api/admin/finance/payments/${paymentId}/reject`, payload);
}

/** Export CSV (returns text) */
export async function exportPaymentsCsv(params: { church_id?: string | number; from?: string; to?: string; type?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.church_id) qs.set('church_id', String(params.church_id));
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.type) qs.set('type', params.type);
  const path = `/api/admin/finance/payments/export${qs.toString() ? `?${qs.toString()}` : ''}`;
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { headers: buildHeaders({ Accept: 'text/csv' }), credentials: 'same-origin' });
  if (!res.ok) throw { status: res.status, message: `Export failed (${res.status})` };
  return await res.text();
}

/** Reconciliations */
export async function fetchReconciliations(params: { church_id?: string | number; page?: number; per_page?: number; q?: string; status?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.church_id) qs.set('church_id', String(params.church_id));
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 30));
  if (params.q) qs.set('q', String(params.q));
  if (params.status) qs.set('status', String(params.status));
  const path = `/api/admin/finance/reconciliations${qs.toString() ? `?${qs.toString()}` : ''}`;
  return apiGet(path);
}
export async function fetchReconciliationById(id: string | number) { return apiGet(`/api/admin/finance/reconciliations/${id}`); }
export async function createReconciliation(payload: Record<string, unknown>) { return apiPost('/api/admin/finance/reconciliations', payload); }
export async function updateReconciliation(id: string | number, payload: Record<string, unknown>) { return apiPut(`/api/admin/finance/reconciliations/${id}`, payload); }
export async function deleteReconciliation(id: string | number) { return apiDelete(`/api/admin/finance/reconciliations/${id}`); }

/** Additional event helpers */
export async function fetchEvents(params: { q?: string; church_id?: string | number; page?: number; per_page?: number; scope?: 'national' | 'church' } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', String(params.q));
  if (params.church_id) qs.set('church_id', String(params.church_id));
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 30));
  if (params.scope) qs.set('scope', params.scope);
  const path = `/api/admin/events${qs.toString() ? `?${qs.toString()}` : ''}`;
  return apiGet(path);
}
export async function fetchEventById(id: string | number) { return apiGet(`/api/admin/events/${id}`); }

/** RSVPs */
export async function fetchEventRsvps(eventId: string | number) { return apiGet(`/api/admin/events/${eventId}/rsvps`); }
export async function createEventRsvp(payload: { event_id: number | string; member_id: number | string; church_id?: number | string; status?: string; notes?: string }) {
  return apiPost('/api/admin/event-rsvps', payload);
}
export async function deleteEventRsvp(id: string | number) { return apiDelete(`/api/admin/event-rsvps/${id}`); }

/** Payments (single) & delete */
export async function fetchPaymentById(id: string | number) { return apiGet(`/api/admin/finance/payments/${id}`); }
export async function deletePayment(id: string | number) { return apiDelete(`/api/admin/finance/payments/${id}`); }

/** Search helpers */
export async function searchMembersByQuery(q: string, limit = 10, churchId?: string | number | null) {
  const qs = new URLSearchParams();
  if (q) qs.set('q', String(q));
  qs.set('per_page', String(limit));
  if (churchId) qs.set('church_id', String(churchId));
  const path = `/api/admin/members${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await apiGet(path);
  return Array.isArray(res) ? res : ((res && (res as Record<string, unknown>).data) ?? []);
}

/**
 * fetch members for a church with paging (used when the new payment form chooses a church)
 */
export async function fetchMembersForChurch(churchId: string | number, params: { q?: string; page?: number; per_page?: number } = {}) {
  const qs = new URLSearchParams();
  qs.set('church_id', String(churchId));
  if (params.q) qs.set('q', String(params.q));
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 30));
  const path = `/api/admin/members?${qs.toString()}`;
  const res = await apiGet(path);
  // keep paginated object as-is
  return res;
}

/* Default export convenience object */
const adminApi = {
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  getAdminUser,
  setAdminUser,
  ensureCsrf,
  createUser,
  verifyAdmin,
  login,
  register,
  logout,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
};

export default adminApi;
