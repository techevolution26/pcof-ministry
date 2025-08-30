// src/app/api/events/[id]/ics/route.ts
import { NextResponse } from 'next/server'
import { fetchEvents } from '@/lib/api'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const events = await fetchEvents().catch(() => [])
  const ev = (events || []).find((e: any) => e.id === params.id)
  if (!ev) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const dtStart = ev.startsAt ? new Date(ev.startsAt).toISOString().replace(/[-:]|\.\d{3}/g,'') : ''
  const dtEnd = ev.endsAt ? new Date(ev.endsAt).toISOString().replace(/[-:]|\.\d{3}/g,'') : ''
  const uid = `event-${ev.id}@pcof.local`
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PCOF//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SUMMARY:${escapeICal(ev.title || '')}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d{3}/g,'')}`,
    ev.startsAt ? `DTSTART:${dtStart}` : '',
    ev.endsAt ? `DTEND:${dtEnd}` : '',
    ev.location ? `LOCATION:${escapeICal(ev.location)}` : '',
    `DESCRIPTION:${escapeICal(ev.description ?? '')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${ev.title?.replace(/\s+/g,'_') || 'event'}.ics"`
    }
  })
}

function escapeICal(input: string) {
  return input.replace(/\\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}
