// src/lib/adminApi.ts
import type {
  ApiResponse,
  ResponseOrData,
  User,
  Church,
  Department,
  Designation,
  Member,
  Minister,
  Event,
  Rsvp,
  Asset,
  Payment,
  Reconciliation,
  FormPayload,
  ID,
} from './types'

const DEV_LOG = true // set to false when done debugging

export const ADMIN_TOKEN_KEY = 'ADMIN_TOKEN'
export const ADMIN_USER_KEY = 'ADMIN_USER'

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  const t = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (!t) return null
  return t.trim()
}

export function setAdminToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token === null) localStorage.removeItem(ADMIN_TOKEN_KEY)
  else localStorage.setItem(ADMIN_TOKEN_KEY, token.trim())
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
}

export function getAdminUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(ADMIN_USER_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as User
    return parsed
  } catch {
    return null
  }
}
export function setAdminUser(user: User | null) {
  if (typeof window === 'undefined') return
  if (user === null) localStorage.removeItem(ADMIN_USER_KEY)
  else localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user))
}

async function parseJsonSafe(res: Response): Promise<unknown | null> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

const BASE = (process.env.NEXT_PUBLIC_API_URL as string) ?? 'http://127.0.0.1:8000'

function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers()
  headers.set('Accept', 'application/json')
  if (extra) {
    const extraHeaders = extra as Record<string, string> | Headers
    if (extraHeaders instanceof Headers) {
      extraHeaders.forEach((v, k) => headers.set(k, v))
    } else {
      Object.entries(extraHeaders).forEach(([k, v]) => {
        if (typeof v === 'string') headers.set(k, v)
      })
    }
  }
  const token = getAdminToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return headers
}

/**
 * Generic fetch with auth wrapper.
 * T is the parsed JSON type the caller expects (could be ApiResponse<TData> or raw data).
 */
async function fetchWithAuth<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? path : `/${path}`}`
  const merged: RequestInit = {
    ...init,
    headers: buildHeaders(init?.headers),
    credentials: 'same-origin',
  }

  if (DEV_LOG) {
    // don't stringify headers (Headers may not be serializable) — log keys for debugging
    console.debug('[api] fetch', url, merged.method ?? 'GET', Object.fromEntries((merged.headers as Headers).entries()))
  }

  const res = await fetch(url, merged)

  if (DEV_LOG) {
    console.debug('[api] response', url, res.status, res.statusText)
  }

  if (res.status === 401) {
    // clear token so UI redirects to login
    clearAdminToken()
  }

  const data = await parseJsonSafe(res)

  if (!res.ok) {
    // handle validation errors specially
    if (res.status === 422 && data && typeof data === 'object' && 'errors' in (data as Record<string, unknown>)) {
      throw {
        status: 422,
        errors: (data as Record<string, unknown>)['errors'],
        message: (data as Record<string, unknown>)['message'] ?? 'Validation failed',
        response: data,
      }
    }
    throw {
      status: res.status,
      message: (data && typeof data === 'object' && 'message' in (data as Record<string, unknown>))
        ? String((data as Record<string, unknown>)['message'])
        : res.statusText || `Request failed (${res.status})`,
      response: data,
    }
  }

  return data as T
}

/** Verify token -> returns user or null */
export async function verifyAdmin(): Promise<User | null> {
  const token = getAdminToken()
  if (!token) return null
  try {
    const data = await fetchWithAuth<ResponseOrData<{ user?: User }>>('/api/me', { method: 'GET' })
    const user = (data && typeof data === 'object' && 'user' in (data as Record<string, unknown>))
      ? (data as Record<string, unknown>)['user'] as User
      : (data as unknown as User)
    if (user) setAdminUser(user)
    return user ?? null
  } catch (err) {
    clearAdminToken()
    return null
  }
}

/** Login/registration helpers */
export async function login(email: string, password: string): Promise<ResponseOrData<{ token?: string; user?: User }>> {
  const res = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'same-origin',
  })
  const data = await parseJsonSafe(res)
  if (!res.ok) {
    if (res.status === 422 && data && typeof data === 'object' && 'errors' in (data as Record<string, unknown>)) {
      throw { status: 422, errors: (data as Record<string, unknown>)['errors'], message: (data as Record<string, unknown>)['message'] ?? 'Validation failed' }
    }
    throw { status: res.status, message: (data && typeof data === 'object' && 'message' in (data as Record<string, unknown>)) ? String((data as Record<string, unknown>)['message']) : 'Login failed', response: data }
  }
  const parsed = data as Record<string, unknown> | null
  if (parsed && 'token' in parsed && parsed['token']) setAdminToken(String(parsed['token']))
  if (parsed && 'user' in parsed && parsed['user']) setAdminUser(parsed['user'] as User)
  return data as ResponseOrData<{ token?: string; user?: User }>
}

export async function register(payload: { name?: string; email: string; password: string; role?: string }): Promise<ResponseOrData<{ token?: string; user?: User }>> {
  const res = await fetch(`${BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'same-origin',
  })
  const data = await parseJsonSafe(res)
  if (!res.ok) {
    if (res.status === 422 && data && typeof data === 'object' && 'errors' in (data as Record<string, unknown>)) {
      throw { status: 422, errors: (data as Record<string, unknown>)['errors'], message: (data as Record<string, unknown>)['message'] ?? 'Validation failed' }
    }
    throw { status: res.status, message: (data && typeof data === 'object' && 'message' in (data as Record<string, unknown>)) ? String((data as Record<string, unknown>)['message']) : `Register failed (${res.status})`, response: data }
  }
  const parsed = data as Record<string, unknown> | null
  if (parsed && 'token' in parsed && parsed['token']) setAdminToken(String(parsed['token']))
  if (parsed && 'user' in parsed && parsed['user']) setAdminUser(parsed['user'] as User)
  return data as ResponseOrData<{ token?: string; user?: User }>
}

export function logout(): void {
  try {
    fetchWithAuth('/api/logout', { method: 'POST' }).catch(() => { })
  } catch {
    // ignore
  }
  clearAdminToken()
}

/**
 * Generic typed helpers for JSON endpoints
 * - TResponse is expected response payload type
 * - TRequest is the request payload type for POST/PUT
 */
export async function apiGet<TResponse = unknown>(path: string): Promise<ResponseOrData<TResponse>> {
  return fetchWithAuth<ResponseOrData<TResponse>>(path, { method: 'GET' })
}
export async function apiPost<TRequest = unknown, TResponse = unknown>(path: string, body?: TRequest): Promise<ResponseOrData<TResponse>> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }
  return fetchWithAuth<ResponseOrData<TResponse>>(path, init)
}
export async function apiPut<TRequest = unknown, TResponse = unknown>(path: string, body?: TRequest): Promise<ResponseOrData<TResponse>> {
  const init: RequestInit = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }
  return fetchWithAuth<ResponseOrData<TResponse>>(path, init)
}

export async function apiDelete<TResponse = unknown>(path: string): Promise<ResponseOrData<TResponse>> {
  return fetchWithAuth<ResponseOrData<TResponse>>(path, { method: 'DELETE' })
}

/** ADMIN SUMMARY */
export async function fetchAdminSummary(): Promise<ResponseOrData<Record<string, unknown>>> {
  return apiGet('/api/admin/summarized')
}

/** Churches */
export async function fetchChurchById(id: ID): Promise<ResponseOrData<Church>> {
  return apiGet<Church>(`/api/admin/churches/${id}`)
}
export async function fetchChurches(): Promise<ResponseOrData<Church[]>> {
  return apiGet<Church[]>('/api/admin/churches')
}
export async function createChurch(payload: FormPayload): Promise<ResponseOrData<Church>> {
  return apiPost<FormPayload, Church>('/api/admin/churches', payload)
}
export async function updateChurch(id: ID, payload: FormPayload): Promise<ResponseOrData<Church>> {
  return apiPut<FormPayload, Church>(`/api/admin/churches/${id}`, payload)
}
export async function deleteChurch(id: ID): Promise<ResponseOrData<null>> {
  return apiDelete(`/api/admin/churches/${id}`)
}

/** Members */
export async function fetchMemberById(id: ID): Promise<ResponseOrData<Member>> {
  return apiGet<Member>(`/api/admin/members/${id}`)
}
export async function createMember(payload: FormPayload): Promise<ResponseOrData<Member>> {
  return apiPost<FormPayload, Member>('/api/admin/members', payload)
}
export async function updateMember(id: ID, payload: FormPayload): Promise<ResponseOrData<Member>> {
  return apiPut<FormPayload, Member>(`/api/admin/members/${id}`, payload)
}
export async function deleteMember(id: ID): Promise<ResponseOrData<null>> {
  return apiDelete(`/api/admin/members/${id}`)
}
export async function fetchChurchesList(): Promise<Church[]> {
  const body = await apiGet<Church[]>('/api/admin/churches?per_page=100')
  // normalize possible { data: [...] } wrapper
  if (Array.isArray(body as unknown)) return body as unknown as Church[]
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    const d = (body as ApiResponse<Church[]>).data
    if (Array.isArray(d)) return d
  }
  return []
}

export async function fetchChurchAssets(churchId: ID): Promise<ResponseOrData<Asset[]>> {
  return apiGet<Asset[]>(`/api/admin/assets?church_id=${churchId}`)
}
export async function fetchChurchEvents(churchId: ID): Promise<ResponseOrData<Event[]>> {
  return apiGet<Event[]>(`/api/admin/events?church_id=${churchId}`)
}

/** Payments / collections endpoints (list + summary) */
export async function fetchChurchPayments(churchId: ID): Promise<ResponseOrData<Payment[]>> {
  return apiGet<Payment[]>(`/api/admin/payments?church_id=${churchId}`)
}

export async function fetchChurchFinanceSummary(churchId?: ID): Promise<ResponseOrData<Record<string, unknown>> | null> {
  if (!churchId) return null
  return apiGet<Record<string, unknown>>(`/api/admin/churches/${churchId}/finance-summary`)
}

/** Admin Users */
export async function fetchAdminUsers(filter = 'all'): Promise<ResponseOrData<User[]>> {
  return apiGet<User[]>(`/api/admin/users?filter=${encodeURIComponent(filter)}`)
}
export async function fetchAdminUser(id: ID): Promise<ResponseOrData<User>> {
  return apiGet<User>(`/api/admin/users/${id}`)
}
export async function approveUser(id: ID): Promise<ResponseOrData<Record<string, unknown>>> {
  return apiPost<unknown, Record<string, unknown>>(`/api/admin/users/${id}/approve`)
}
export async function revokeUser(id: ID): Promise<ResponseOrData<Record<string, unknown>>> {
  return apiPost<unknown, Record<string, unknown>>(`/api/admin/users/${id}/revoke`)
}
export async function assignRoleToUser(userId: ID, role: string): Promise<ResponseOrData<Record<string, unknown>>> {
  return apiPost<{ role: string }, Record<string, unknown>>(`/api/admin/users/${userId}/roles`, { role })
}
export async function removeRoleFromUser(userId: ID, role: string): Promise<ResponseOrData<null>> {
  return apiDelete(`/api/admin/users/${userId}/roles/${encodeURIComponent(role)}`)
}

/* Roles endpoints */
export async function fetchRoles(): Promise<ResponseOrData<Record<string, unknown>[]>> { return apiGet('/api/admin/roles') }
export async function createRole(payload: FormPayload): Promise<ResponseOrData<Record<string, unknown>>> { return apiPost('/api/admin/roles', payload) }
export async function updateRole(id: ID, payload: FormPayload): Promise<ResponseOrData<Record<string, unknown>>> { return apiPut(`/api/admin/roles/${id}`, payload) }
export async function deleteRole(id: ID): Promise<ResponseOrData<null>> { return apiDelete(`/api/admin/roles/${id}`) }

/* Events (JSON and FormData flows) */
export async function fetchAdminEvents(params: { q?: string; church_id?: ID; page?: number } = {}): Promise<ResponseOrData<Event[]>> {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.page) qs.set('page', String(params.page))
  const path = `/api/admin/events${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet<Event[]>(path)
}

export async function fetchAdminEventById(id: ID): Promise<ResponseOrData<Event>> {
  return apiGet<Event>(`/api/admin/events/${id}`)
}

export async function deleteAdminEvent(id: ID): Promise<ResponseOrData<null>> {
  return fetchWithAuth<ResponseOrData<null>>(`/api/admin/events/${id}`, { method: 'DELETE' })
}

/**
 * Create/Update event using JSON (no image)
 */
export async function createAdminEvent(payload: FormPayload): Promise<ResponseOrData<Event>> {
  return apiPost<FormPayload, Event>('/api/admin/events', payload)
}
export async function updateAdminEvent(id: ID, payload: FormPayload): Promise<ResponseOrData<Event>> {
  return apiPut<FormPayload, Event>(`/api/admin/events/${id}`, payload)
}

/**
 * Create/Update event using FormData (supports file)
 * Accepts `form` as Record<string, unknown> (no `any`)
 */
export async function createAdminEventFormData(form: Record<string, unknown>, imageFile?: File | null): Promise<ResponseOrData<Event>> {
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
  return fetchWithAuth<ResponseOrData<Event>>('/api/admin/events', { method: 'POST', body: fd })
}

export async function updateAdminEventFormData(id: ID, form: Record<string, unknown>, imageFile?: File | null): Promise<ResponseOrData<Event>> {
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
  fd.append('_method', 'PUT')
  return fetchWithAuth<ResponseOrData<Event>>(`/api/admin/events/${id}`, { method: 'POST', body: fd })
}

/* Assemblies */
export async function fetchAssemblies(params: { q?: string; church_id?: ID } = {}): Promise<ResponseOrData<Record<string, unknown>[]>> {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  const path = `/api/admin/assemblies${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet(path)
}
export async function fetchAssemblyById(id: ID): Promise<ResponseOrData<Record<string, unknown>>> { return apiGet(`/api/admin/assemblies/${id}`) }
export async function createAssembly(payload: FormPayload): Promise<ResponseOrData<Record<string, unknown>>> { return apiPost('/api/admin/assemblies', payload) }
export async function updateAssembly(id: ID, payload: FormPayload): Promise<ResponseOrData<Record<string, unknown>>> { return apiPut(`/api/admin/assemblies/${id}`, payload) }
export async function deleteAssembly(id: ID): Promise<ResponseOrData<null>> { return apiDelete(`/api/admin/assemblies/${id}`) }

/* Departments */
export async function fetchDepartments(params: { q?: string; church_id?: ID; page?: number } = {}): Promise<ResponseOrData<Department[]>> {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.page) qs.set('page', String(params.page))
  const path = `/api/admin/departments${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet<Department[]>(path)
}

export async function fetchDepartmentsList(params?: { church_id?: ID }): Promise<Department[]> {
  const qs = new URLSearchParams()
  qs.set('per_page', '100')
  if (params?.church_id) qs.set('church_id', String(params.church_id))
  const url = `/api/admin/departments?${qs.toString()}`
  const body = await apiGet<Department[]>(url)
  if (Array.isArray(body as unknown)) return body as unknown as Department[]
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    const d = (body as ApiResponse<Department[]>).data
    if (Array.isArray(d)) return d
  }
  return []
}

export async function fetchDepartmentById(id: ID): Promise<ResponseOrData<Department>> { return apiGet<Department>(`/api/admin/departments/${id}`) }
export async function createDepartment(payload: FormPayload): Promise<ResponseOrData<Department>> { return apiPost('/api/admin/departments', payload) }
export async function updateDepartment(id: ID, payload: FormPayload): Promise<ResponseOrData<Department>> { return apiPut(`/api/admin/departments/${id}`, payload) }
export async function deleteDepartment(id: ID): Promise<ResponseOrData<null>> { return apiDelete(`/api/admin/departments/${id}`) }

/* Designations */
export async function fetchDesignations(): Promise<ResponseOrData<Designation[]>> { return apiGet<Designation[]>('/api/admin/designations') }
export async function fetchDesignationById(id: ID): Promise<ResponseOrData<Designation>> { return apiGet<Designation>(`/api/admin/designations/${id}`) }
export async function createDesignation(payload: FormPayload): Promise<ResponseOrData<Designation>> { return apiPost('/api/admin/designations', payload) }
export async function updateDesignation(id: ID, payload: FormPayload): Promise<ResponseOrData<Designation>> { return apiPut(`/api/admin/designations/${id}`, payload) }
export async function deleteDesignation(id: ID): Promise<ResponseOrData<null>> { return apiDelete(`/api/admin/designations/${id}`) }

export async function fetchDesignationsList(): Promise<Designation[]> {
  const body = await apiGet<Designation[]>('/api/admin/designations?per_page=100')
  if (Array.isArray(body as unknown)) return body as unknown as Designation[]
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    const d = (body as ApiResponse<Designation[]>).data
    if (Array.isArray(d)) return d
  }
  return []
}

/* Ministers */
export async function fetchMinisters(params: { q?: string; church_id?: ID; department_id?: ID; page?: number } = {}): Promise<ResponseOrData<Minister[]>> {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.department_id) qs.set('department_id', String(params.department_id))
  if (params.page) qs.set('page', String(params.page))
  return apiGet<Minister[]>(`/api/admin/ministers${qs.toString() ? `?${qs.toString()}` : ''}`)
}
export async function fetchMinisterById(id: ID): Promise<ResponseOrData<Minister>> { return apiGet<Minister>(`/api/admin/ministers/${id}`) }
export async function createMinister(payload: FormPayload): Promise<ResponseOrData<Minister>> { return apiPost('/api/admin/ministers', payload) }
export async function updateMinister(id: ID, payload: FormPayload): Promise<ResponseOrData<Minister>> { return apiPut(`/api/admin/ministers/${id}`, payload) }
export async function deleteMinister(id: ID): Promise<ResponseOrData<null>> { return apiDelete(`/api/admin/ministers/${id}`) }

/* Members search for typeahead */
export async function searchMembers(q = '', per_page = 10): Promise<Member[]> {
  const qs = new URLSearchParams()
  if (q) qs.set('q', String(q))
  qs.set('per_page', String(per_page))
  const path = `/api/admin/members${qs.toString() ? `?${qs.toString()}` : ''}`
  const body = await apiGet<Member[]>(path)
  if (Array.isArray(body as unknown)) return body as unknown as Member[]
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    const d = (body as ApiResponse<Member[]>).data
    if (Array.isArray(d)) return d
  }
  return []
}

/** Public (no-auth) API: fetch churches for typeahead (not admin-only) */
export async function fetchPublicChurches(params: { q?: string; limit?: number } = {}): Promise<Church[]> {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.limit) qs.set('limit', String(params.limit))
  const url = `/api/churches${qs.toString() ? `?${qs.toString()}` : ''}`
  const res = await fetch((url.startsWith('http') ? url : `${BASE}${url.startsWith('/') ? url : `/${url}`}`), {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  })
  const body = await parseJsonSafe(res)
  if (!res.ok) throw { status: res.status, message: body && typeof body === 'object' && 'message' in (body as Record<string, unknown>) ? (body as Record<string, unknown>)['message'] : res.statusText, response: body }
  if (Array.isArray(body as unknown)) return body as unknown as Church[]
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    const d = (body as ApiResponse<Church[]>).data
    if (Array.isArray(d)) return d
  }
  return []
}

/* Assets */
export async function fetchAssets(params: { q?: string; church_id?: ID; page?: number; per_page?: number } = {}): Promise<ResponseOrData<Asset[]>> {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.page) qs.set('page', String(params.page))
  if (params.per_page) qs.set('per_page', String(params.per_page))
  const path = `/api/admin/assets${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet<Asset[]>(path)
}

export async function fetchAssetById(id: ID): Promise<ResponseOrData<Asset>> {
  return apiGet<Asset>(`/api/admin/assets/${id}`)
}

export async function deleteAsset(id: ID): Promise<ResponseOrData<null>> {
  return apiDelete(`/api/admin/assets/${id}`)
}

// JSON (no file)
export async function createAdminAsset(payload: FormPayload): Promise<ResponseOrData<Asset>> {
  return apiPost('/api/admin/assets', payload)
}
export async function updateAdminAsset(id: ID, payload: FormPayload): Promise<ResponseOrData<Asset>> {
  return apiPut(`/api/admin/assets/${id}`, payload)
}

// FormData flows (file support)
export async function createAdminAssetFormData(form: Record<string, unknown>, file?: File | null): Promise<ResponseOrData<Asset>> {
  const fd = new FormData()
  Object.entries(form).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (typeof v === 'object' && !(v instanceof File) && !Array.isArray(v)) {
      fd.append(k, JSON.stringify(v))
    } else {
      fd.append(k, String(v))
    }
  })
  if (file) fd.append('file', file)
  return fetchWithAuth<ResponseOrData<Asset>>('/api/admin/assets', { method: 'POST', body: fd })
}

export async function updateAdminAssetFormData(id: ID, form: Record<string, unknown>, file?: File | null): Promise<ResponseOrData<Asset>> {
  const fd = new FormData()
  Object.entries(form).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (typeof v === 'object' && !(v instanceof File) && !Array.isArray(v)) {
      fd.append(k, JSON.stringify(v))
    } else {
      fd.append(k, String(v))
    }
  })
  if (file) fd.append('file', file)
  fd.append('_method', 'PUT')
  return fetchWithAuth<ResponseOrData<Asset>>(`/api/admin/assets/${id}`, { method: 'POST', body: fd })
}

/* Finance (frontend helpers) */

// list payments (paginated)
export async function fetchPayments(params: { q?: string; church_id?: ID; page?: number; per_page?: number } = {}): Promise<ResponseOrData<Payment[]>> {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.page) qs.set('page', String(params.page))
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 30))
  const path = `/api/admin/finance/payments${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet<Payment[]>(path)
}

export async function createPayment(payload: FormPayload): Promise<ResponseOrData<Payment>> {
  return apiPost('/api/admin/finance/payments', payload)
}

// tithes
export async function fetchTithes(params: { church_id?: ID; page?: number; per_page?: number } = {}): Promise<ResponseOrData<Payment[]>> {
  const qs = new URLSearchParams()
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.page) qs.set('page', String(params.page))
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 30))
  const path = `/api/admin/finance/tithes${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet<Payment[]>(path)
}
export async function createTithe(payload: FormPayload): Promise<ResponseOrData<Payment>> {
  return apiPost('/api/admin/finance/tithes', payload)
}

// finance summary
export async function fetchAdminFinanceSummary(churchId?: ID): Promise<ResponseOrData<Record<string, unknown>>> {
  const qs = new URLSearchParams()
  if (churchId) qs.set('church_id', String(churchId))
  return apiGet<Record<string, unknown>>(`/api/admin/finance/summary${qs.toString() ? `?${qs.toString()}` : ''}`)
}

/** Fetch church-specific summary */
export async function fetchChurchSummary(churchId: ID, params: { days?: number } = {}): Promise<ResponseOrData<Record<string, unknown>>> {
  const qs = new URLSearchParams()
  if (params.days) qs.set('days', String(params.days))
  const path = `/api/admin/churches/${churchId}/summary${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet<Record<string, unknown>>(path)
}

/** Ministers (simple list; backend should support ?church_id & q) */
export async function fetchMinistersList(params: { q?: string; church_id?: ID; per_page?: number } = {}): Promise<Minister[]> {
  const qs = new URLSearchParams()
  qs.set('per_page', String(params.per_page ?? 100))
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  const body = await apiGet<Minister[]>(`/api/admin/ministers?${qs.toString()}`)
  if (Array.isArray(body as unknown)) return body as unknown as Minister[]
  if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
    const d = (body as ApiResponse<Minister[]>).data
    if (Array.isArray(d)) return d
  }
  return []
}

/** Members (paginated, scoped by church_id optionally) */
export async function fetchChurchMembers(params: { church_id?: ID; q?: string; page?: number; per_page?: number } = {}): Promise<ResponseOrData<Member[]>> {
  const qs = new URLSearchParams()
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.q) qs.set('q', String(params.q))
  if (params.page) qs.set('page', String(params.page))
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 25))
  const path = `/api/admin/members${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet<Member[]>(path)
}

/** Approve a submitted payment (admin action) */
export async function approvePayment(paymentId: ID): Promise<ResponseOrData<Record<string, unknown>>> {
  return apiPost(`/api/admin/finance/payments/${paymentId}/approve`)
}

/** Reject a payment (optional reason) */
export async function rejectPayment(paymentId: ID, payload: { reason?: string } = {}): Promise<ResponseOrData<Record<string, unknown>>> {
  return apiPost(`/api/admin/finance/payments/${paymentId}/reject`, payload)
}

/** Export payments CSV for given filters (returns CSV text) */
export async function exportPaymentsCsv(params: { church_id?: ID; from?: string; to?: string; type?: string } = {}): Promise<string> {
  const qs = new URLSearchParams()
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)
  if (params.type) qs.set('type', params.type)
  const path = `/api/admin/finance/payments/export${qs.toString() ? `?${qs.toString()}` : ''}`
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, { headers: buildHeaders({ Accept: 'text/csv' }), credentials: 'same-origin' })
  if (!res.ok) throw { status: res.status, message: `Export failed (${res.status})` }
  return await res.text()
}

/* Reconciliations */
export async function fetchReconciliations(params: { church_id?: ID; page?: number; per_page?: number; q?: string; status?: string } = {}): Promise<ResponseOrData<Reconciliation[]>> {
  const qs = new URLSearchParams()
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.page) qs.set('page', String(params.page))
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 30))
  if (params.q) qs.set('q', String(params.q))
  if (params.status) qs.set('status', String(params.status))
  const path = `/api/admin/finance/reconciliations${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet<Reconciliation[]>(path)
}

export async function fetchReconciliationById(id: ID): Promise<ResponseOrData<Reconciliation>> { return apiGet<Reconciliation>(`/api/admin/finance/reconciliations/${id}`) }
export async function createReconciliation(payload: FormPayload): Promise<ResponseOrData<Reconciliation>> { return apiPost('/api/admin/finance/reconciliations', payload) }
export async function updateReconciliation(id: ID, payload: FormPayload): Promise<ResponseOrData<Reconciliation>> { return apiPut(`/api/admin/finance/reconciliations/${id}`, payload) }
export async function deleteReconciliation(id: ID): Promise<ResponseOrData<null>> { return apiDelete(`/api/admin/finance/reconciliations/${id}`) }

/* Events list helper */
export async function fetchEvents(params: { q?: string; church_id?: ID; page?: number; per_page?: number; scope?: 'national' | 'church' } = {}): Promise<ResponseOrData<Event[]>> {
  const qs = new URLSearchParams()
  if (params.q) qs.set('q', String(params.q))
  if (params.church_id) qs.set('church_id', String(params.church_id))
  if (params.page) qs.set('page', String(params.page))
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 30))
  if (params.scope) qs.set('scope', params.scope)
  const path = `/api/admin/events${qs.toString() ? `?${qs.toString()}` : ''}`
  return apiGet<Event[]>(path)
}

/* Event helpers */
export async function fetchEventById(id: ID): Promise<ResponseOrData<Event>> {
  return apiGet<Event>(`/api/admin/events/${id}`)
}

/* RSVPs endpoints */
export async function fetchEventRsvps(eventId: ID): Promise<ResponseOrData<Rsvp[]>> {
  return apiGet<Rsvp[]>(`/api/admin/events/${eventId}/rsvps`)
}
export async function createEventRsvp(payload: { event_id: ID; member_id: ID; church_id?: ID; status?: string; notes?: string }): Promise<ResponseOrData<Rsvp>> {
  return apiPost<typeof payload, Rsvp>('/api/admin/event-rsvps', payload)
}
export async function deleteEventRsvp(id: ID): Promise<ResponseOrData<null>> {
  return apiDelete(`/api/admin/event-rsvps/${id}`)
}

/* fetch single payment */
export async function fetchPaymentById(id: ID): Promise<ResponseOrData<Payment>> {
  return apiGet<Payment>(`/api/admin/finance/payments/${id}`)
}

/* delete payment */
export async function deletePayment(id: ID): Promise<ResponseOrData<null>> {
  return apiDelete(`/api/admin/finance/payments/${id}`)
}

/* Search members by query (typeahead) */
export async function searchMembersByQuery(q: string, limit = 10, churchId?: ID | null): Promise<Member[]> {
  const qs = new URLSearchParams()
  if (q) qs.set('q', String(q))
  qs.set('per_page', String(limit))
  if (churchId) qs.set('church_id', String(churchId))
  const path = `/api/admin/members${qs.toString() ? `?${qs.toString()}` : ''}`
  const res = await apiGet<Member[]>(path)
  if (Array.isArray(res as unknown)) return res as unknown as Member[]
  if (res && typeof res === 'object' && 'data' in (res as Record<string, unknown>)) {
    const d = (res as ApiResponse<Member[]>).data
    if (Array.isArray(d)) return d
  }
  return []
}

/**
 * fetch members for a church with paging (used when the new payment form chooses a church)
 * We return the raw response so caller can access pagination metadata if present.
 */
export async function fetchMembersForChurch(churchId: ID, params: { q?: string; page?: number; per_page?: number } = {}): Promise<ResponseOrData<Member[]>> {
  const qs = new URLSearchParams()
  qs.set('church_id', String(churchId))
  if (params.q) qs.set('q', String(params.q))
  if (params.page) qs.set('page', String(params.page))
  if (params.per_page) qs.set('per_page', String(params.per_page ?? 30))
  const path = `/api/admin/members?${qs.toString()}`
  return apiGet<Member[]>(path)
}

const adminApi = {
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  getAdminUser,
  setAdminUser,
  verifyAdmin,
  login,
  register,
  logout,
  apiGet,
  apiPost,
  apiPut,
}
export default adminApi
