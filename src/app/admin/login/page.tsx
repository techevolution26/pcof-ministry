// src/app/admin/login/page.tsx
'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/lib/adminApi'
import Link from 'next/link'
import { setAdminToken } from '@/lib/adminApi'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // in your admin login page (client component)
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password); // login from adminApi (await)
      if (!res?.token) {
        postMessage('Account created or inactive — awaiting approval.');
        return;
      }
      // token already saved by login(); now redirect
      router.replace('/admin');
    } catch (err) {
      // handle errors
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
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
            <Link href="/" className="text-sm text-gray-600">Back</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
