// src/app/api/events/[id]/rsvp/route.ts
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fetchEvents } from '@/lib/api'
import type { EventItem, RSVP } from '@/types'

/** Resolve params that may be a plain object or a Promise-like. */
async function resolveParams(paramsOrPromise: unknown): Promise<{ id?: string }> {
  if (!paramsOrPromise) return {}
  const maybe = paramsOrPromise as { then?: unknown }
  if (maybe && typeof maybe.then === 'function') {
    return (await paramsOrPromise) as { id?: string }
  }
  return paramsOrPromise as { id?: string }
}

export async function POST(req: Request, context: { params?: unknown }) {
  try {
    const ctxParams = await resolveParams(context?.params)
    const id = ctxParams?.id
    if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 })

    const raw = (await req.json()) as unknown
    if (typeof raw !== 'object' || raw === null) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
    }

    const body = raw as { name?: unknown; email?: unknown }
    const name = String(body.name ?? '').trim()
    const email = String(body.email ?? '').trim()

    if (!name || !email) return NextResponse.json({ message: 'Missing name or email' }, { status: 400 })
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ message: 'Invalid email' }, { status: 400 })

    // Validate event exists
    const events = (await fetchEvents().catch(() => [])) as EventItem[]
    const ev = events.find(e => String(e.id) === String(id))
    if (!ev) return NextResponse.json({ message: 'Event not found' }, { status: 404 })

    // Dev-only: append RSVP to public/data/rsvps_{id}.json
    const file = path.join(process.cwd(), 'public', 'data', `rsvps_${id}.json`)
    let all: RSVP[] = []
    try {
      const rawFile = await fs.promises.readFile(file, 'utf8')
      const parsed = JSON.parse(rawFile)
      if (Array.isArray(parsed)) {
        all = parsed as RSVP[]
      }
    } catch {
      all = []
    }

    const entry: RSVP = {
      id: `rsvp_${Date.now()}`,
      name,
      email,
      createdAt: new Date().toISOString(),
    }

    all.unshift(entry)
    await fs.promises.mkdir(path.dirname(file), { recursive: true })
    await fs.promises.writeFile(file, JSON.stringify(all, null, 2), 'utf8')

    return NextResponse.json({ message: 'ok', entry })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error')
    console.error('RSVP route error', msg)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
