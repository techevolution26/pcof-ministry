'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchMinisterById, deleteMinister } from '@/lib/adminApi'
import Link from 'next/link'

export default function MinisterShowPage() {
    const params = useParams() as { id?: string }
    const id = params?.id
    const router = useRouter()
    const [item, setItem] = useState<any | null>(null)

    useEffect(() => {
        if (!id) return
        let mounted = true
            ; (async () => {
                try {
                    const res = await fetchMinisterById(id)
                    if (!mounted) return
                    setItem(res?.data ?? res)
                } catch (err) {
                    console.error(err)
                }
            })()
        return () => { mounted = false }
    }, [id])

    if (!item) return <div>Loading…</div>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">{item.member ? `${item.member.first_name} ${item.member.last_name}` : `Minister #${item.id}`}</h1>
                    <div className="text-sm text-gray-500">{item.title ?? ''}</div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/admin/ministers/${item.id}/edit`} className="px-3 py-2 bg-sky-600 text-white rounded">Edit</Link>
                    <button onClick={async () => { if (confirm('Delete?')) { await deleteMinister(item.id); router.push('/admin/ministers') } }} className="px-3 py-2 bg-red-50 text-red-600 rounded">Delete</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow">
                <div><strong>Department:</strong> {item.department?.name ?? '—'}</div>
                <div><strong>Started:</strong> {item.started_at ? new Date(item.started_at).toLocaleDateString() : '—'}</div>
                <div><strong>Ended:</strong> {item.ended_at ? new Date(item.ended_at).toLocaleDateString() : '—'}</div>
                <div><strong>Active:</strong> {item.active ? 'Yes' : 'No'}</div>
            </div>
        </div>
    )
}
