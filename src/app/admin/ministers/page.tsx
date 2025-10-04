'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchMinisters } from '@/lib/adminApi'

export default function AdminMinistersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetchMinisters()
        if (!mounted) return
        const list = Array.isArray(res) ? res : (res?.data ?? [])
        setItems(list)
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Loading ministers…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Ministers</h1>
        <Link href="/admin/ministers/new" className="px-3 py-2 bg-sky-600 text-white rounded">Add minister</Link>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="p-3">Member</th>
              <th className="p-3">Department</th>
              <th className="p-3">Title</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(m => (
              <tr key={m.id} className="border-t last:border-b">
                <td className="p-3">{m.member ? `${m.member.first_name} ${m.member.last_name}` : `#${m.member_id}`}</td>
                <td className="p-3">{m.department?.name ?? '—'}</td>
                <td className="p-3">{m.title ?? '—'}</td>
                <td className="p-3">{m.active ? 'Yes' : 'No'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/ministers/${m.id}`} className="text-sky-600">View</Link>
                    <Link href={`/admin/ministers/${m.id}/edit`} className="text-gray-600">Edit</Link>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="p-4 text-gray-500">No ministers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
