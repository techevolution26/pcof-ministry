// src/app/admin/members/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiGet, deleteMember } from '@/lib/adminApi'

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const body = await apiGet('/api/admin/members')
        const list = Array.isArray(body) ? body : (body?.data ?? [])
        if (!mounted) return
        setMembers(list)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message ?? 'Failed to load members')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function handleDelete(id: number | string) {
    if (!confirm('Delete this member?')) return
    try {
      await deleteMember(id)
      setMembers(prev => prev.filter(m => String(m.id) !== String(id)))
    } catch (err: any) {
      alert(err?.message ?? 'Delete failed')
    }
  }

  if (loading) return <div>Loading members…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Members</h1>
        <div className="flex gap-2">
          <Link href="/admin/members/new" className="px-3 py-2 bg-sky-600 text-white rounded">Add member</Link>
          <Link href="/admin/members/export" className="px-3 py-2 border rounded">Export CSV</Link>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Church</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-t last:border-b">
                <td className="p-3">{m.member_number ?? m.id}</td>
                <td className="p-3">{m.first_name} {m.last_name}</td>
                <td className="p-3">{m.phone}</td>
                <td className="p-3">{m.church?.name ?? '—'}</td>
                <td className="p-3">{m.is_active ? 'Active' : 'Inactive'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/members/${m.id}/edit`} className="text-sky-600">Edit</Link>
                    <button onClick={() => handleDelete(m.id)} className="text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {members.length === 0 && <tr><td colSpan={6} className="p-4 text-gray-500">No members yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
