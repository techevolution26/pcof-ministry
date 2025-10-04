'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchDesignationsList, deleteDesignation } from '@/lib/adminApi'

export default function AdminDesignationsPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const res = await fetchDesignationsList()
                    if (!mounted) return
                    setItems(res)
                } catch (err) { console.error(err) }
                finally { if (mounted) setLoading(false) }
            })()
        return () => { mounted = false }
    }, [])

    if (loading) return <div>Loading…</div>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Designations</h1>
                <Link href="/admin/designations/new" className="px-3 py-2 bg-sky-600 text-white rounded">Create</Link>
            </div>

            <div className="bg-white rounded shadow">
                <ul>
                    {items.map(d => (
                        <li key={d.id} className="p-4 border-b flex justify-between">
                            <div>
                                <div className="font-medium">{d.name}</div>
                                <div className="text-sm text-gray-500">{d.description}</div>
                            </div>
                            <div className="flex gap-2 items-center">
                                <Link href={`/admin/designations/${d.id}`} className="text-sky-600">View</Link>
                                <Link href={`/admin/designations/${d.id}/edit`} className="text-gray-600">Edit</Link>
                                <button onClick={async () => { if (confirm('Delete designation?')) { await deleteDesignation(d.id); setItems(prev => prev.filter(x => x.id !== d.id)) } }} className="text-red-600">Delete</button>
                            </div>
                        </li>
                    ))}
                    {items.length === 0 && <li className="p-4 text-gray-500">No designations yet.</li>}
                </ul>
            </div>
        </div>
    )
}
