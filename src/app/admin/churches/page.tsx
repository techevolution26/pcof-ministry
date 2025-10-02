// src/app/admin/churches/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiGet, deleteChurch } from '@/lib/adminApi'
import { useRouter } from 'next/navigation'

export default function AdminChurchesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const body = await apiGet('/api/admin/churches')
        const list = Array.isArray(body) ? body : (body?.data ?? [])
        if (!mounted) return
        setItems(list)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message ?? 'Failed to load churches')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [router])

  async function handleDelete(id: number | string) {
    if (!confirm('Delete this church? This action cannot be undone.')) return
    try {
      await deleteChurch(id)
      // optimistic UI: remove locally
      setItems(prev => prev.filter(c => String(c.id) !== String(id)))
    } catch (err: any) {
      alert(err?.message ?? 'Delete failed')
    }
  }

  if (loading) return <div>Loading churches…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Churches</h1>
        <Link href="/admin/churches/new" className="px-3 py-2 bg-sky-600 text-white rounded">Create</Link>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Branch</th>
              <th className="p-3">Pastor</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t last:border-b">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.branch ?? '—'}</td>
                <td className="p-3">{c.pastor ?? '—'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/churches/${c.id}`} className="text-sky-600">View</Link>
                    <Link href={`/admin/churches/${c.id}/edit`} className="text-gray-600">Edit</Link>
                    <button onClick={() => handleDelete(c.id)} className="text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="p-4 text-gray-500">No churches yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
