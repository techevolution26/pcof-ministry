// components/RSVPForm.tsx
'use client'
import React, { useState } from 'react'

export default function RSVPForm({ eventId, capacity }: { eventId: string, capacity?: number }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'sending'|'ok'|'error'>('idle')
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
    <form onSubmit={submit} className="max-w-md space-y-3">
      <label className="block">
        <span className="text-sm">Full name</span>
        <input className="w-full p-2 border rounded" value={name} onChange={e => setName(e.target.value)} required />
      </label>

      <label className="block">
        <span className="text-sm">Email</span>
        <input type="email" className="w-full p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} required />
      </label>

      {capacity ? <div className="text-xs text-slate-500">Capacity: {capacity} — first come, first served</div> : null}

      <div>
        <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded" disabled={status === 'sending'}>
          {status === 'sending' ? 'Registering…' : 'Register / RSVP'}
        </button>
      </div>

      {message && <div className={`text-sm mt-2 ${status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{message}</div>}
    </form>
  )
}
