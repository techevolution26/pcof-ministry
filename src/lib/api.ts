// src/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

async function safeJson(res: Response){
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchChurches(query = '') {
  const q = query ? `?q=${encodeURIComponent(query)}` : ''
  const res = await fetch(`${BASE}/churches${q}`, { cache: 'force-cache' })
  return safeJson(res)
}

export async function fetchChurch(id: string) {
  const res = await fetch(`${BASE}/churches/${id}`, { cache: 'force-cache' })
  return safeJson(res)
}

export async function fetchEvents() {
  const res = await fetch(`${BASE}/events`, { cache: 'force-cache' })
  return safeJson(res)
}

export async function fetchSermons() {
  const res = await fetch(`${BASE}/sermons`, { cache: 'force-cache' })
  return safeJson(res)
}

export async function fetchLeadership() {
  // if leadership is stored as part of DB, expose via /churches or a /leadership endpoint.
  const res = await fetch(`${BASE}/leadership`, { cache: 'force-cache' }).catch(() => null)
  return res ? safeJson(res) : []
}
