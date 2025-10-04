'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { register, verifyAdmin } from '@/lib/adminApi'
import ChurchTypeahead from '@/components/ChurchTypeahead'

type Role = 'church_admin' | 'superadmin' | 'viewer'

export default function AdminRegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('church_admin')   // <-- role is a string union
  const [selectedChurch, setSelectedChurch] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<any>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setErrors(null)
    setLoading(true)

    try {
      // Build payload; include church_id only if present and role is church_admin
      const payload: any = { name, email, password, role }
      if (role === 'church_admin' && selectedChurch?.id) payload.church_id = selectedChurch.id

      const res = await register(payload)

      if (res?.token) {
        // If a token was issued (e.g. viewer), verify and redirect
        try { await verifyAdmin() } catch (_) { /* ignore */ }
        router.replace('/admin')
        return
      }

      // otherwise show awaiting-approval message
      setMessage(res?.message ?? 'Registered — awaiting admin approval.')
    } catch (err: any) {
      if (err?.status === 422) setErrors(err.errors)
      else setMessage(err?.message ?? 'Registration failed')
      console.error('Registration error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">Create admin account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full p-3 border rounded" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full p-3 border rounded" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-3 border rounded" />

          <select
            value={role}
            onChange={e => setRole(e.target.value as Role)}
            className="w-full p-3 border rounded"
          >
            <option value="church_admin">Church admin (approval required)</option>
            <option value="viewer">Viewer</option>
            <option value="superadmin">Superadmin (approval required)</option>
          </select>

          {/* Show church selection when role is church_admin (optional) */}
          {role === 'church_admin' && (
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Which church will you manage? (optional)</label>

              <ChurchTypeahead
                value={selectedChurch?.id ?? ''}
                onSelect={(c) => setSelectedChurch(c)}
                placeholder="Start typing a church name..."
              />

              <div className="text-xs text-gray-500 mt-1">Selection does not bypass approval — superadmin will confirm.</div>
            </div>
          )}

          {message && <div className="text-sm text-sky-700">{message}</div>}
          {errors && <pre className="text-sm text-red-600">{JSON.stringify(errors, null, 2)}</pre>}

          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">Create account</button>
          </div>
        </form>
      </div>
    </div>
  )
}
