'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAssemblies, deleteAssembly } from '@/lib/adminApi'

export default function AssembliesPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const body = await fetchAssemblies()
        const arr = Array.isArray(body) ? body : (body?.data ?? [])
        if (!mounted) return
        setList(arr)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message ?? 'Failed to load assemblies')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  async function handleDelete(id: number) {
    if (!confirm('Delete assembly?')) return
    try {
      await deleteAssembly(id)
      setList(prev => prev.filter(x => x.id !== id))
    } catch (err: any) {
      alert(err?.message ?? 'Delete failed')
    }
  }

  if (loading) return <div>Loading assemblies…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Assemblies</h1>
        <Link href="/admin/assemblies/new" className="px-3 py-2 bg-sky-600 text-white rounded">Create</Link>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Church</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(a => (
              <tr key={a.id} className="border-t last:border-b">
                <td className="p-3">{a.name}</td>
                <td className="p-3">{a.church?.name ?? a.church_id ?? '—'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/assemblies/${a.id}`} className="text-sky-600">View</Link>
                    <Link href={`/admin/assemblies/${a.id}/edit`} className="text-gray-600">Edit</Link>
                    <button onClick={() => handleDelete(a.id)} className="text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={3} className="p-4 text-gray-500">No assemblies yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
