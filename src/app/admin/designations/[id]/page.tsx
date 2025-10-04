'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchDesignationById, deleteDesignation } from '@/lib/adminApi'
import Link from 'next/link'

export default function DesignationShow() {
  const params = useParams() as { id?: string }
  const id = params?.id
  const router = useRouter()
  const [item, setItem] = useState<any|null>(null)

  useEffect(() => {
    if (!id) return
    let mounted = true
    ;(async () => {
      try {
        const res = await fetchDesignationById(id)
        if (!mounted) return
        setItem(res?.data ?? res)
      } catch (err) { console.error(err) }
    })()
    return () => { mounted = false }
  }, [id])

  if (!item) return <div>Loading…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <div className="text-sm text-gray-500">{item.description}</div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/designations/${item.id}/edit`} className="px-3 py-2 bg-sky-600 text-white rounded">Edit</Link>
          <button onClick={async () => { if (confirm('Delete designation?')) { await deleteDesignation(item.id); router.push('/admin/designations') } }} className="px-3 py-2 bg-red-50 text-red-600 rounded">Delete</button>
        </div>
      </div>
    </div>
  )
}
