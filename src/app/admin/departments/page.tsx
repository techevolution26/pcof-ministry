'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchDepartments, deleteDepartment } from '@/lib/adminApi'

export default function DepartmentsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetchDepartments()
        const list = Array.isArray(res) ? res : (res?.data ?? [])
        if (!mounted) return
        setItems(list)
      } catch (err) { console.error(err) }
      finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Loading departments…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Departments</h1>
        <Link href="/admin/departments/new" className="px-3 py-2 bg-sky-600 text-white rounded">Create</Link>
      </div>
      <div className="bg-white rounded shadow">
        <ul>
          {items.map(d => (
            <li key={d.id} className="p-3 border-b flex justify-between">
              <div>
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-gray-500">{d.church?.name ?? 'Global'}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/departments/${d.id}`} className="text-sky-600">View</Link>
                <Link href={`/admin/departments/${d.id}/edit`} className="text-gray-600">Edit</Link>
                <button onClick={async () => { if(confirm('Delete?')) { await deleteDepartment(d.id); setItems(items.filter(x=>x.id!==d.id)) } }} className="text-red-600">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
