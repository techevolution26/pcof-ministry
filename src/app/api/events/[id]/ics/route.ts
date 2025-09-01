// src/app/api/events/[id]/ics/route.ts
import { NextResponse } from 'next/server'
import { fetchEvents } from '@/lib/api'
import type { EventItem } from '@/types'

/**
 * Resolve params which might be a plain object or a promise (Next internals).
 */
async function resolveParams(paramsOrPromise: unknown): Promise<{ id?: string }> {
  if (!paramsOrPromise) return {}
  // detect thenable without using `any`
  const maybe = paramsOrPromise as { then?: unknown }
  if (maybe && typeof maybe.then === 'function') {
    // it's a promise-like
    return (await paramsOrPromise) as { id?: string }
  }
  return paramsOrPromise as { id?: string }
}

export async function GET(req: Request, context: { params?: unknown }) {
  try {
    const ctxParams = await resolveParams(context?.params)
    const id = ctxParams?.id
    if (!id) {
      return NextResponse.json({ message: 'Missing id' }, { status: 400 })
    }

    const events = (await fetchEvents().catch(() => [])) as EventItem[]
    const ev = events.find(e => String(e.id) === String(id))
    if (!ev) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const dtStart = ev.startsAt ? new Date(ev.startsAt).toISOString().replace(/[-:]|\.\d{3}/g, '') : ''
    const dtEnd = ev.endsAt ? new Date(ev.endsAt).toISOString().replace(/[-:]|\.\d{3}/g, '') : ''
    const uid = `event-${ev.id}@pcof.local`
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PCOF//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `SUMMARY:${(ev.title ?? '').replace(/\n/g, ' ')}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d{3}/g, '')}`,
      ev.startsAt ? `DTSTART:${dtStart}` : '',
      ev.endsAt ? `DTEND:${dtEnd}` : '',
      ev.location ? `LOCATION:${(ev.location ?? '').replace(/,/g, '\\,')}` : '',
      `DESCRIPTION:${(ev.description ?? '').replace(/\n/g, '\\n')}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')

    return new Response(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${(ev.title ?? 'event').replace(/\s+/g, '_')}.ics"`,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err ?? 'Unknown error')
    console.error('ICS route error', msg)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
