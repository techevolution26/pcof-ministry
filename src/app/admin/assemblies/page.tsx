// /src/app/admin/assemblies/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAssemblies, deleteAssembly } from '@/lib/adminApi'

type Assembly = {
  id: number
  name?: string
  church?: { name?: string }
  church_id?: number
  description?: string
  members?: Array<{ id: number; first_name?: string; last_name?: string }>
}

/** Safely unwraps values like `{ data: ... }` returned by some APIs */
function extractData<T>(val: unknown): T | undefined {
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>
    if ('data' in obj) {
      return obj['data'] as T
    }
  }
  return val as T | undefined
}

export default function AssembliesPage() {
  const [list, setList] = useState<Assembly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        setLoading(true)
        try {
          const body = await fetchAssemblies()
          const arr = Array.isArray(body)
            ? (body as Assembly[])
            : (extractData<Assembly[]>(body) ?? [])
          if (!mounted) return
          setList(arr)
        } catch (err: unknown) {
          if (!mounted) return
          const errorMessage = err instanceof Error ? err.message : String(err)
          setError(errorMessage ?? 'Failed to load assemblies')
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // using alert here to match original behaviour -or toast
      alert(msg ?? 'Delete failed')
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
