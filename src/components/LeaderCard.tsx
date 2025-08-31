// src/components/LeaderCard.tsx
'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Leader = {
  id: string
  name: string
  title?: string
  role?: string
  photoUrl?: string
  email?: string
  phone?: string
  bio?: string
  startedAt?: string
}

export default function LeaderCard({ leader }: { leader: Leader }) {
  const [open, setOpen] = useState(false)
  const initials = (leader.name || '')
    .split(' ')
    .map(s => s[0])
    .slice(0, 2)
    .join('')

  return (
    <article className="bg-white rounded-2xl shadow-md p-5 border border-green-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-sky-100 flex items-center justify-center flex-shrink-0">
          {leader.photoUrl ? (
            <Image src={leader.photoUrl} alt={`${leader.name} photo`} width={80} height={80} style={{ objectFit: 'cover' }} />
          ) : (
            <div className="text-xl font-bold text-sky-600">{initials}</div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{leader.name}</h3>
              <div className="text-sm text-slate-500 mt-1">{leader.title ?? leader.role}</div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-2">
              {leader.email ? (
                <a href={`mailto:${leader.email}`} className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1" aria-label={`Email ${leader.name}`}>
                  <span>✉️</span> Email
                </a>
              ) : null}
              {leader.phone ? (
                <a href={`tel:${leader.phone}`} className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1" aria-label={`Call ${leader.name}`}>
                  <span>📞</span> Call
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-3 text-sm text-slate-700 line-clamp-3">{leader.bio ? leader.bio : 'No bio available.'}</div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              aria-controls={`leader-bio-${leader.id}`}
              className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1"
            >
              <span>{open ? '▲' : '▼'}</span> {open ? 'Hide bio' : 'Read bio'}
            </button>

            <Link href={`/leadership/${leader.id}`} className="text-sm px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center gap-1">
              <span>👁️</span> View profile
            </Link>
          </div>

          {open && (
            <div id={`leader-bio-${leader.id}`} className="mt-4 pt-4 border-t border-green-100 text-sm text-slate-700">
              {leader.bio}
              {leader.startedAt && (
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                  <span>⏳</span> Serving since {new Date(leader.startedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}