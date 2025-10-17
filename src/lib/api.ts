// src/lib/api.ts (SERVER only; used from Server Components)
import fs from 'fs'
import path from 'path'
const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

async function serverFetch<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const url = path.startsWith('http') ? path : `${BACKEND}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: revalidateSeconds } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchChurches() { return serverFetch<unknown[]>('/api/admin/churches', 60); }
export async function fetchSermons() { return serverFetch<unknown[]>('/api/admin/sermons', 60); }
export async function fetchEvents() { return serverFetch<unknown[]>('/api/admin/events', 60); }
export async function fetchMembers() { return serverFetch<unknown[]>('/api/admin/members', 60); }
export async function fetchMember(id: string | number) { return serverFetch<unknown>(`/api/admin/members/${id}`, 60); }
export async function fetchFinanceSummary() { return serverFetch<unknown>('/api/admin/finance/summary', 300); }
export async function fetchAdminSummary() { return serverFetch<unknown>('/api/admin/summary', 300); }  //here
export async function fetchAdminUserProfile() { return serverFetch<unknown>('/api/admin/profile', 300); }
export async function fetchAdminUsers(filter = 'all') { return serverFetch<unknown[]>(`/api/admin/users?filter=${filter}`, 60); }

export async function fetchLeadership() {
  // server: read from file system (fast, reliable during SSR)
  if (typeof window === 'undefined') {
    const file = path.join(process.cwd(), 'public', 'data', 'leadership.json')
    try {
      const raw = await fs.promises.readFile(file, 'utf8')
      return JSON.parse(raw)
    } catch (err) {
      console.error('fetchLeadership error (server):', err)
      return []
    }
  }
}