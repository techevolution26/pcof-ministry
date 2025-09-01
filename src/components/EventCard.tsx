// src/components/EventCard.tsx
'use client'

import Link from 'next/link'
import React from 'react'
import type { EventItem } from '@/types'

type Props = {
  event: EventItem
}

export default function EventCard({ event }: Props) {
  const starts = event.startsAt ?? null
  const timeLabel = starts ? starts.toLocaleString() : 'TBD'
  const tags = Array.isArray(event.tags) ? event.tags : []
  const isUpcoming = starts !== null && starts > new Date().toISOString()

  return (
    <article className="bg-white rounded-2xl shadow-md p-5 border border-green-100 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-800">{event.title}</h3>
        <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
          <span>👤</span> {event.host ?? 'PCOF'}
        </div>

        <div className="mt-4 text-sm text-slate-600 flex items-center gap-1">
          <span>⏰</span> {timeLabel}
        </div>

        {event.location && (
          <div className="text-sm text-slate-600 mt-1 flex items-center gap-1">
            <span>📍</span> {event.location}
          </div>
        )}

        {event.description && (
          <p className="text-sm text-slate-700 mt-3 line-clamp-3">{event.description}</p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 pt-4 border-t border-green-100">
        <Link
          href={`/events/${event.id}`}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center gap-1"
        >
          <span>👁️</span> Details
        </Link>

        {isUpcoming && (
          <Link
            href={`/events/${event.id}#rsvp`}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors flex items-center gap-1"
          >
            <span>✅</span> RSVP
          </Link>
        )}

        {event.locationUrl && (
          <a
            href={event.locationUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>🗺️</span> Directions
          </a>
        )}
      </div>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.slice(0, 3).map((t) => (
            <span key={t} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
