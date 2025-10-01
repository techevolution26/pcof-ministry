// src/app/admin/register/page.tsx
'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { register } from '@/lib/adminApi'

export default function AdminRegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'church_admin' | 'viewer' | 'superadmin'>('church_admin')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<any>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null); setErrors(null); setLoading(true)
    try {
      const res = await register({ name, email, password, role })
      if (res?.token) {
        router.replace('/admin')
        return
      }
      setMessage(res?.message ?? 'Registered — awaiting admin approval.')
    } catch (err: any) {
      if (err?.status === 422) setErrors(err.errors)
      else setMessage(err?.message ?? 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">Create admin account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full p-3 border rounded" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full p-3 border rounded" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-3 border rounded" />
          <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full p-3 border rounded">
            <option value="church_admin">Church admin (approval required)</option>
            <option value="viewer">Viewer</option>
            <option value="superadmin">Superadmin</option>
          </select>

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
