//app/admin/login/page.tsx
'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/lib/adminApi'
import { verifyAdmin as apiVerifyAdmin } from '@/lib/adminApi'
import { setAdminUser } from '@/lib/adminApi'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await login(email, password)
      // If backend returns a token we should verify to get the user
      if (res?.token) {
        const verified = await apiVerifyAdmin()
        if (!verified) {
          setError('Verification failed after login.')
          setLoading(false)
          return
        }
        // persist a lightweight user for immediate UI use
        try { setAdminUser(verified) } catch { /* ignore */ }

        // role-based redirect:
        // - superadmin -> admin dashboard
        // - church_admin -> their church dashboard or church list
        // - viewer or other -> generic admin home
        if (verified.role === 'superadmin') {
          router.replace('/admin'); // full admin console
          return;
        }
        if (verified.role === 'church_admin') {
          // Redirect church_admin into the church-admin console
          router.replace('/admin/church'); // new church area
          return;
        }
        router.replace('/admin');
        return
      }

      // token not returned — e.g. registration pending approval
      setError(res?.message ?? 'Account awaiting approval.')
    } catch (err: any) {
      setError(err?.message ?? 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold mb-1">Admin sign in</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with your admin credentials.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <div className="text-xs text-gray-600 mb-1">Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full p-3 border rounded-lg" />
          </label>

          <label className="block">
            <div className="text-xs text-gray-600 mb-1">Password</div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full p-3 border rounded-lg" />
          </label>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex items-center justify-between gap-3">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-3 rounded-2xl bg-indigo-600 text-white">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <Link href="/admin/register" className="text-sm text-gray-600">Register</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
