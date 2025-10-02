'use client'
import React from 'react'
import Link from 'next/link'

export default function EventCards({ events }: { events: any[] }) {
  if (!events || events.length === 0) return <div className="text-sm text-gray-500">No events</div>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map(e => (
        <div key={e.id} className="bg-white rounded-lg p-4 shadow">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="text-lg font-semibold">{e.title}</div>
              <div className="text-xs text-gray-500">{e.church?.name ?? ''}</div>
              <div className="mt-2 text-sm text-slate-700">{e.location ?? (e.online ? 'Online' : '')}</div>
            </div>
            {e.image_path || e.image_url ? (
              <img src={e.image_url ?? e.image_path} alt="" className="w-20 h-20 object-cover rounded" />
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">{e.starts_at ? new Date(e.starts_at).toLocaleString() : ''}</div>
            <Link href={`/admin/events/${e.id}`} className="text-sky-600 text-sm">View</Link>
          </div>
        </div>
      ))}
    </div>
  )
}
