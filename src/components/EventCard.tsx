// components/EventCard.tsx
'use client'

import Link from 'next/link'
import React from 'react'

export default function EventCard({ event }: { event: any }) {
  const starts = event.startsAt ? new Date(event.startsAt) : null
  const timeLabel = starts ? starts.toLocaleString() : 'TBD'
  const tags = event.tags || []

  return (
    <article className="border rounded-lg p-4 flex flex-col h-full">
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{event.title}</h3>
        <div className="text-xs text-slate-500 mt-1">{event.host ?? 'PCOF'}</div>
        <div className="text-sm text-slate-600 mt-3">{timeLabel}</div>
        {event.location && <div className="text-sm text-slate-600">{event.location}</div>}
        <p className="text-sm text-slate-700 mt-3 line-clamp-3">{event.description ?? ''}</p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link href={`/events/${event.id}`} className="px-3 py-1 border rounded text-sm">Details</Link>
        <Link href={`/events/${event.id}#rsvp`} className="px-3 py-1 bg-sky-600 text-white rounded text-sm">RSVP</Link>
        {event.locationUrl && <a href={event.locationUrl} target="_blank" rel="noreferrer" className="ml-auto text-sm underline">Directions</a>}
      </div>

      <div className="mt-2 flex gap-2 text-xs">
        {tags.slice(0,3).map((t:string)=> <span key={t} className="px-2 py-0.5 border rounded">{t}</span>)}
      </div>
    </article>
  )
}
