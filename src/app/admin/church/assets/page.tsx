// app/admin/church/assets/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchChurchAssets } from '@/lib/adminApi'
import Link from 'next/link'

export default function ChurchAssetsPage() {
    const { user, isLoading } = useAdminAuth()
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const churchId = user?.church_id

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                if (!churchId) { setItems([]); return }
                const body = await fetchChurchAssets(churchId)
                if (!mounted) return
                setItems(Array.isArray(body) ? body : (body?.data ?? []))
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [churchId, isLoading])

    if (isLoading || loading) return <div className="p-6 text-gray-500">Loading assets…</div>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold">Assets ({items.length})</h1>
                <Link href="/admin/church/assets/new" className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Add asset</Link>
            </div>

            <div className="bg-white rounded shadow overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-500"><tr><th className="p-2">Tag</th><th className="p-2">Name</th><th className="p-2">Location</th></tr></thead>
                    <tbody>
                        {items.map(a => (
                            <tr key={a.id} className="border-t">
                                <td className="p-2">{a.asset_tag ?? '—'}</td>
                                <td className="p-2">{a.name ?? '—'}</td>
                                <td className="p-2">{a.location ?? '—'}</td>
                            </tr>
                        ))}
                        {items.length === 0 && <tr><td colSpan={3} className="p-4 text-gray-500">No assets yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
