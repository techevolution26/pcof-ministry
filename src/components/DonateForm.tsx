// src/components/DonateForm.tsx
'use client'

import React, { useState } from 'react'

type Props = {
  currency?: string // e.g., 'KES', 'USD'
}

export default function DonateForm({ currency = 'KES' }: Props) {
  const [amount, setAmount] = useState<number | ''>(1000) // default KES 1000
  const [frequency, setFrequency] = useState<'one_time'|'monthly'>('one_time')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suggested = [500, 1000, 5000]

  function formatAmount(val:number) {
    // display with currency; adjust if you store cents server-side
    return `${val.toLocaleString()} ${currency}`
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // basic validation
    const amt = typeof amount === 'number' ? amount : Number(amount)
    if (!amt || amt <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/donate/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          currency,
          frequency,
          donor: { name, email },
          // optional metadata:
          description: `Donation by ${name || email}`,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Failed to create checkout session')
      // redirect to Stripe Checkout
      if (json.url) {
        window.location.href = json.url
      } else {
        setError('No checkout URL returned.')
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-md p-6 border border-green-100 space-y-6">
      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <span className="text-sky-600">💝</span> Make a Donation
      </h3>
      
      {/* Amount Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">Amount ({currency})</label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {suggested.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setAmount(s)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                amount === s 
                  ? 'bg-sky-600 text-white border-sky-600' 
                  : 'border-gray-300 hover:bg-green-50'
              }`}
            >
              {formatAmount(s)}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium text-slate-700 mb-2">Or enter custom amount</label>
          <input
            type="number"
            min={1}
            step={1}
            value={amount as any}
            onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
            aria-label="Custom donation amount"
          />
        </div>
      </div>

      {/* Frequency Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">Frequency</label>
        <div className="grid grid-cols-2 gap-3">
          <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
            frequency === 'one_time' 
              ? 'bg-sky-600 text-white border-sky-600' 
              : 'border-gray-300 hover:bg-green-50'
          }`}>
            <input 
              type="radio" 
              name="freq" 
              className="sr-only" 
              checked={frequency === 'one_time'} 
              onChange={() => setFrequency('one_time')} 
            />
            <span className="flex items-center gap-2">
              <span>💳</span> One-time
            </span>
          </label>

          <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
            frequency === 'monthly' 
              ? 'bg-sky-600 text-white border-sky-600' 
              : 'border-gray-300 hover:bg-green-50'
          }`}>
            <input 
              type="radio" 
              name="freq" 
              className="sr-only" 
              checked={frequency === 'monthly'} 
              onChange={() => setFrequency('monthly')} 
            />
            <span className="flex items-center gap-2">
              <span>🔄</span> Monthly
            </span>
          </label>
        </div>
      </div>

      {/* Donor Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Name (optional)</label>
          <input 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Full name" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
          <input 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="you@example.com" 
            required 
          />
        </div>
      </div>

      {/* Submit Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-green-100">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="text-green-600">🔒</span>
          <span>Secure payments by Stripe</span>
        </div>
        
        <button 
          type="submit" 
          className="px-6 py-3 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center gap-2" 
          disabled={processing}
        >
          {processing ? (
            <>
              <span className="animate-spin">⏳</span>
              Processing…
            </>
          ) : frequency === 'monthly' ? (
            <>
              <span>🔄</span>
              Donate monthly
            </>
          ) : (
            <>
              <span>💝</span>
              Donate now
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm flex items-center gap-2">
          <span>❌</span> {error}
        </div>
      )}

      {/* Info Text */}
      <div className="text-xs text-slate-500 p-3 bg-green-50 rounded-lg">
        You will be redirected to a secure payment page to complete your donation. You will receive a receipt by email.
      </div>
    </form>
  )
}