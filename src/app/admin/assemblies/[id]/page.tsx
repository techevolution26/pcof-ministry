'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchAssemblyById } from '@/lib/adminApi'

type Member = {
  id?: string | number
  first_name?: string
  last_name?: string
}

type Assembly = {
  id?: string | number
  name?: string
  description?: string
  church?: { name?: string }
  members?: Member[]
}

/**
 * Safely extract `.data` if present; otherwise return the value itself.
 * Uses Record<string, unknown> to avoid `any`.
 */
function extractData<T>(val: unknown): T {
  if (val && typeof val === 'object') {
    const obj = val as Record<string, unknown>
    if ('data' in obj) {
      return obj['data'] as T
    }
  }
  return val as T
}

export default function AssemblyShow() {
  const { id } = useParams() as { id?: string }
  const router = useRouter()
  const [assembly, setAssembly] = useState<Assembly | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let mounted = true
      ; (async () => {
        try {
          const res = await fetchAssemblyById(id)
          if (!mounted) return
          const body = extractData<Assembly>(res)
          setAssembly(body ?? null)
        } catch (err) {
          console.error(err)
          // navigate away if there's a problem loading
          router.replace('/admin/assemblies')
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    return () => {
      mounted = false
    }
  }, [id, router])

  if (loading) return <div>Loading…</div>
  if (!assembly) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{assembly.name ?? 'Assembly'}</h1>
          <div className="text-sm text-gray-500">{assembly.church?.name ?? ''}</div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/assemblies/${id}/edit`} className="px-3 py-2 border rounded">
            Edit
          </Link>
          <Link href="/admin/assemblies" className="px-3 py-2 border rounded">
            Back
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <p>{assembly.description ?? 'No description'}</p>

        <h3 className="mt-4 font-semibold">Members</h3>
        <div className="mt-2">
          {assembly.members && assembly.members.length > 0 ? (
            <ul>
              {assembly.members.map((m) => (
                <li key={String(m.id ?? `${m.first_name ?? ''}-${m.last_name ?? ''}`)} className="py-1">
                  {m.first_name ?? ''} {m.last_name ?? ''}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">No members</div>
          )}
        </div>
      </div>
    </div>
  )
}
