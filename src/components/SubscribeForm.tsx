/* ---------------------------------------------------------
   Minimal client subscription form. It's a simple UI that
   posts to /api/subscribe (you can implement that route).
   The component is intentionally small and accessible.
   ---------------------------------------------------------*/
'use client'
import { useState } from 'react'

export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('sending')
    try {
      // If you don't have /api/subscribe, this will return 404.
      // Replace with your email provider integration later.
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus('ok')
      setEmail('')
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2 max-w-md" aria-label="Subscribe to newsletter">
      <label className="sr-only" htmlFor="subscribe-email">Email</label>
      <input
        id="subscribe-email"
        type="email"
        required
        placeholder="you@domain.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 p-2 border rounded"
      />
      <button className="px-4 py-2 bg-sky-600 text-white rounded" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Subscribe'}
      </button>

      {status === 'ok' && <div className="text-sm text-green-600 ml-2">Thanks — check your inbox.</div>}
      {status === 'error' && <div className="text-sm text-red-600 ml-2">Could not subscribe.</div>}
    </form>
  )
}