'use client'
import React from 'react'
import Link from 'next/link'

export default function AdminEventCard({ events }: { events: any[] }) {
  if (!events || events.length === 0) return <div className="text-sm text-gray-500">No events</div>

  return (
    <div className="grid grid-cols-1 gap-4">
      {events.map(e => (
        <div key={e.id} className="bg-white rounded-lg p-4 shadow flex gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{e.title}</div>
                <div className="text-xs text-gray-500">{e.church?.name ?? (e.is_national ? 'National' : '—')}</div>
              </div>
              <div className="text-right">
                {e.is_national && <div className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded">National</div>}
                <div className="text-xs text-gray-400 mt-1">{e.starts_at ? new Date(e.starts_at).toLocaleString() : ''}</div>
              </div>
            </div>

            <div className="mt-2 text-sm text-slate-700">{e.location ?? (e.online ? 'Online' : '')}</div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Capacity: {e.capacity ?? '—'}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/events/${e.id}`} className="text-sky-600 text-sm">View</Link>
                <Link href={`/admin/events/${e.id}/edit`} className="text-gray-600 text-sm">Edit</Link>
              </div>
            </div>
          </div>

          {e.image_url || e.image_path ? (
            <img src={e.image_url ?? e.image_path} alt={e.title} className="w-28 h-28 object-cover rounded" />
          ) : (
            <div className="w-28 h-28 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No image</div>
          )}
        </div>
      ))}
    </div>
  )
}
