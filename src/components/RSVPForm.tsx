// components/RSVPForm.tsx
'use client'
import React, { useState } from 'react'

export default function RSVPForm({ eventId, capacity }: { eventId: string, capacity?: number }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !name) { setMessage('Please provide name and email.'); return }
    setStatus('sending')
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Failed')
      setStatus('ok')
      setMessage('Thanks — your registration is confirmed.')
      setName(''); setEmail('')
    } catch (err: any) {
      setStatus('error')
      setMessage(err?.message || 'Could not register.')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="text-sky-600">✅</span> Register for this Event
      </h3>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            <span>👤</span> Full name
          </span>
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Enter your full name"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
            <span>✉️</span> Email
          </span>
          <input
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="your.email@example.com"
          />
        </label>

        {capacity && (
          <div className="text-sm text-slate-600 bg-green-50 p-3 rounded-lg flex items-center gap-2">
            <span>🎫</span> Capacity: {capacity} — first come, first served
          </div>
        )}

        <div>
          <button
            type="submit"
            className="px-6 py-3 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? (
              <>
                <span className="animate-spin">⏳</span>
                Registering…
              </>
            ) : (
              <>
                <span>✅</span>
                Register / RSVP
              </>
            )}
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm mt-2 ${status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} flex items-center gap-2`}>
            <span>{status === 'ok' ? '✅' : '❌'}</span>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}