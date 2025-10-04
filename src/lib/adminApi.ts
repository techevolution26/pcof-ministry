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
  return apiGet('/api/admin/summarized');
}

export async function fetchAdminFinanceSummary(): Promise<any> {
  // returns whatever /api/admin/finance/summary returns (object)
  return apiGet('/api/admin/finance');
}

export async function apiDelete(path: string) {
  return fetchWithAuth(path, { method: 'DELETE' });
}

/** Churches */
export async function fetchChurchById(id: string | number) {
  return apiGet(`/api/admin/churches/${id}`);
}
export async function fetchChurches() {

  return apiGet('/api/admin/churches');
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

/* Events */
// export async function fetchAdminEvents(params: { q?: string; church_id?: string | number; page?: number } = {}) {
//   const qs = new URLSearchParams()
//   if (params.q) qs.set('q', String(params.q))
//   if (params.church_id) qs.set('church_id', String(params.church_id))
//   if (params.page) qs.set('page', String(params.page))
//   const path = `/api/admin/events${qs.toString() ? `?${qs.toString()}` : ''}`
//   return apiGet(path)
// }

// export async function fetchAdminEventById(id: string | number) {
//   return apiGet(`/api/admin/events/${id}`)
// }

// export async function createAdminEvent(payload: any) {
//   // file upload suppor different implementation using FormData.
//   return apiPost('/api/admin/events', payload)
// }

// export async function updateAdminEvent(id: string | number, payload: any) {
//   return apiPut(`/api/admin/events/${id}`, payload)
// }

// export async function deleteAdminEvent(id: string | number) {
//   return apiDelete(`/api/admin/events/${id}`)
// }

// Events (JSON and FormData flows)
export async function fetchAdminEvents(params: { q?: string; church_id?: string | number; page?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.page) qs.set('page', String(params.page))
  const path = `/api/admin/events${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet(path)
}

export async function fetchAdminEventById(id: string | number) {
  return apiGet(`/api/admin/events/${id}`)
}

export async function deleteAdminEvent(id: string | number) {
  return fetchWithAuth(`/api/admin/events/${id}`, { method: 'DELETE' })
}

/**
 * Create event using JSON (no image)
 */
export async function createAdminEvent(payload: any) {
  return apiPost('/api/admin/events', payload)
}

/**
 * Update event using JSON (no image)
 */
export async function updateAdminEvent(id: string | number, payload: any) {
  return apiPut(`/api/admin/events/${id}`, payload)
}

/**
 * Create event with FormData (supports file).
 * If file present, use this; otherwise you can call createAdminEvent.
 */
export async function createAdminEventFormData(form: Record<string, any>, imageFile?: File | null) {
  const fd = new FormData()
  Object.entries(form).forEach(([k, v]) => {
    // Skip undefined, null or empty strings — Laravel's nullable|exists can fail on ''.
    if (v === undefined || v === null) return
    if (typeof v === 'string' && v.trim() === '') return

    // Normalize booleans to '1'/'0' (Laravel accepts these easily)
    if (typeof v === 'boolean') {
      fd.append(k, v ? '1' : '0')
      return
    }

    // Objects (not File/Array) -> JSON
    if (typeof v === 'object' && !(v instanceof File) && !Array.isArray(v)) {
      try {
        fd.append(k, JSON.stringify(v))
      } catch {
        // fallback to string
        fd.append(k, String(v))
      }
      return
    }

    // Arrays -> append each value with key[] so Laravel can accept them
    if (Array.isArray(v)) {
      v.forEach(item => fd.append(`${k}[]`, typeof item === 'object' ? JSON.stringify(item) : String(item)))
      return
    }

    fd.append(k, String(v))
  })
  if (imageFile) fd.append('image', imageFile)
  // don't set headers so browser sets multipart/form-data
  return fetchWithAuth('/api/admin/events', { method: 'POST', body: fd })
}

/**
 * Update event with FormData. Laravel prefers PUT for the route; when sending multipart
 * we use POST + _method=PUT for compatibility.
 */
export async function updateAdminEventFormData(id: string | number, form: Record<string, any>, imageFile?: File | null) {
  const fd = new FormData()
  Object.entries(form).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (typeof v === 'string' && v.trim() === '') return

    if (typeof v === 'boolean') {
      fd.append(k, v ? '1' : '0')
      return
    }

    if (typeof v === 'object' && !(v instanceof File) && !Array.isArray(v)) {
      try {
        fd.append(k, JSON.stringify(v))
      } catch {
        fd.append(k, String(v))
      }
      return
    }

    if (Array.isArray(v)) {
      v.forEach(item => fd.append(`${k}[]`, typeof item === 'object' ? JSON.stringify(item) : String(item)))
      return
    }

    fd.append(k, String(v))
  })
  if (imageFile) fd.append('image', imageFile)
  // use POST + _method=PUT for compatibility with multipart PUTs
  fd.append('_method', 'PUT')
  return fetchWithAuth(`/api/admin/events/${id}`, { method: 'POST', body: fd })
}



/* Assemblies */
export async function fetchAssemblies(params: { q?: string; church_id?: string | number } = {}) {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  const path = `/api/admin/assemblies${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet(path)
}

export async function fetchAssemblyById(id: string | number) {
  return apiGet(`/api/admin/assemblies/${id}`)
}

export async function createAssembly(payload: any) {
  return apiPost('/api/admin/assemblies', payload)
}

export async function updateAssembly(id: string | number, payload: any) {
  return apiPut(`/api/admin/assemblies/${id}`, payload)
}

export async function deleteAssembly(id: string | number) {
  return apiDelete(`/api/admin/assemblies/${id}`)
}

// Departments
export async function fetchDepartments(params: { q?: string; church_id?: string | number; page?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.page) qs.set('page', String(params.page))
  const path = `/api/admin/departments${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet(path)
}

export async function fetchDepartmentsList(params?: { church_id?: string | number }) {
  const qs = new URLSearchParams();
  qs.set('per_page', '100');
  if (params?.church_id) {
    qs.set('church_id', String(params.church_id));
  }
  const url = `/api/admin/departments?${qs.toString()}`;
  const body = await apiGet(url);
  return Array.isArray(body) ? body : (body?.data ?? []);
}

export async function fetchDepartmentById(id: string | number) { return apiGet(`/api/admin/departments/${id}`) }
export async function createDepartment(payload: any) { return apiPost('/api/admin/departments', payload) }
export async function updateDepartment(id: string | number, payload: any) { return apiPut(`/api/admin/departments/${id}`, payload) }
export async function deleteDepartment(id: string | number) { return apiDelete(`/api/admin/departments/${id}`) }

// Designations
export async function fetchDesignations() { return apiGet('/api/admin/designations') }
export async function fetchDesignationById(id: string | number) { return apiGet(`/api/admin/designations/${id}`) }
export async function createDesignation(payload: any) { return apiPost('/api/admin/designations', payload) }
export async function updateDesignation(id: string | number, payload: any) { return apiPut(`/api/admin/designations/${id}`, payload) }
export async function deleteDesignation(id: string | number) { return apiDelete(`/api/admin/designations/${id}`) }

export async function fetchDesignationsList() {
  const body = await apiGet('/api/admin/designations?per_page=100');
  return Array.isArray(body) ? body : (body?.data ?? []);
}

// Ministers
export async function fetchMinisters(params: { q?: string; church_id?: string | number; department_id?: string | number, page?: number } = {}) {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.department_id) qs.set('department_id', String(params.department_id))
  if (params.page) qs.set('page', String(params.page))
  return apiGet(`/api/admin/ministers${qs.toString() ? `?${qs.toString()}` : ''}`)
}
export async function fetchMinisterById(id: string | number) { return apiGet(`/api/admin/ministers/${id}`) }
export async function createMinister(payload: any) { return apiPost('/api/admin/ministers', payload) }
export async function updateMinister(id: string | number, payload: any) { return apiPut(`/api/admin/ministers/${id}`, payload) }
export async function deleteMinister(id: string | number) { return apiDelete(`/api/admin/ministers/${id}`) }

/* Members search for typeahead */
export async function searchMembers(q = '', per_page = 10) {
  const qs = new URLSearchParams();
  if (q) qs.set('q', String(q));
  qs.set('per_page', String(per_page));
  const path = `/api/admin/members${qs.toString() ? `?${qs.toString()}` : ''}`;
  const body = await apiGet(path);
  // paginated backend returns { data: [...] }
  return Array.isArray(body) ? body : (body?.data ?? []);
}

export async function searchMembersByQuery(q: string, limit = 10) {
  // adjust the backend endpoint to support q param, e.g. /api/admin/members/search?q=...
  const res = await apiGet(`/api/admin/members?per_page=${limit}&q=${encodeURIComponent(q)}`)
  // backend returns paginated { data: [...] } — normalize to array
  return Array.isArray(res) ? res : (res?.data ?? [])
}

/** Public (no-auth) API: fetch churches for typeahead (not admin-only) */
export async function fetchPublicChurches(params: { q?: string; limit?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', String(params.q));
  if (params.limit) qs.set('limit', String(params.limit));
  const url = `/api/churches${qs.toString() ? `?${qs.toString()}` : ''}`;
  // NOTE: use native fetch without auth so it hits public endpoint
  const res = await fetch((url.startsWith('http') ? url : `${BASE}${url.startsWith('/') ? url : `/${url}`}`), {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw { status: res.status, message: body?.message ?? res.statusText, response: body };
  return Array.isArray(body) ? body : (body?.data ?? []);
}



const adminApi = { getAdminToken, setAdminToken, clearAdminToken, getAdminUser, setAdminUser, verifyAdmin, login, register, logout, apiGet, apiPost, apiPut };
export default adminApi;
