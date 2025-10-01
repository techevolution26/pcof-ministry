// src/app/admin/users/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { apiGet, apiPut } from '@/lib/adminApi'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const body = await apiGet('/api/admin/users?filter=pending')
        const list = Array.isArray(body) ? body : (body?.data ?? [])
        if (!mounted) return
        setUsers(list)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message ?? 'Failed to load users')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function approve(userId: number) {
    try {
      await apiPut(`/api/admin/users/${userId}/approve`, {})
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'approved' } : u))
    } catch (err: any) {
      alert(err?.message || 'Approve failed')
    }
  }

  if (loading) return <div>Loading users…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users / Approvals</h1>
      <div className="bg-white rounded shadow">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.status}</td>
                <td className="p-3">
                  {u.status === 'pending' && (
                    <button onClick={() => approve(u.id)} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={5} className="p-4 text-gray-500">No pending users.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
