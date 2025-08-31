// components/SubscribeForm.tsx
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
    <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end" aria-label="Subscribe to newsletter">
        <div className="flex-1 w-full">
          <label htmlFor="subscribe-email" className="text-sm font-medium text-slate-700 mb-1 block">
            Email address
          </label>
          <input
            id="subscribe-email"
            type="email"
            required
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
          />
        </div>

        <button
          className="px-6 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          type="submit"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? (
            <>
              <span className="animate-spin">⏳</span>
              Sending…
            </>
          ) : (
            <>
              <span>📧</span>
              Subscribe
            </>
          )}
        </button>
      </form>

      {status === 'ok' && (
        <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-lg text-sm flex items-center gap-2">
          <span>✅</span> Thanks — check your inbox.
        </div>
      )}

      {status === 'error' && (
        <div className="mt-3 p-3 bg-red-100 text-red-800 rounded-lg text-sm flex items-center gap-2">
          <span>❌</span> Could not subscribe. Please try again.
        </div>
      )}
    </div>
  )
}