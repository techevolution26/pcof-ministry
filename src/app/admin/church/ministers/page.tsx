'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchMinistersList } from '@/lib/adminApi'

export default function MinistersListPage() {
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        if (!churchId) return () => { mounted = false }
            ; (async () => {
                setLoading(true)
                try {
                    const body = await fetchMinistersList({ church_id: churchId, per_page: 100 })
                    if (!mounted) return
                    const list = Array.isArray(body) ? body : (body?.data ?? [])
                    setRows(list)
                } catch (err) {
                    // ignore
                } finally { if (mounted) setLoading(false) }
            })()
        return () => { mounted = false }
    }, [churchId])

    if (isLoading || loading) return <div className="p-6 text-gray-500">Loading ministers…</div>
    if (!churchId) return <div className="p-6 text-red-600">No church associated.</div>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold">Ministers ({rows.length})</h1>
                <Link href="/admin/church/ministers/new" className="px-3 py-1 bg-sky-600 text-white rounded text-sm">New minister</Link>
            </div>

            <div className="bg-white rounded shadow overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-500">
                        <tr><th className="p-2">#</th><th className="p-2">Name</th><th className="p-2">Title</th><th className="p-2">Active</th><th className="p-2">Actions</th></tr>
                    </thead>
                    <tbody>
                        {rows.map((r: any) => (
                            <tr key={r.id} className="border-t">
                                <td className="p-2">{r.id}</td>
                                <td className="p-2">{r.member?.first_name ? `${r.member.first_name} ${r.member.last_name ?? ''}` : r.member?.name ?? '—'}</td>
                                <td className="p-2">{r.title ?? (r.designation?.name ?? '—')}</td>
                                <td className="p-2">{r.active ? 'Yes' : 'No'}</td>
                                <td className="p-2">
                                    <Link href={`/admin/church/ministers/${r.id}`} className="text-sky-600 mr-3">View</Link>
                                    <Link href={`/admin/church/ministers/${r.id}/edit`} className="text-gray-600">Edit</Link>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && <tr><td colSpan={5} className="p-4 text-gray-500">No ministers yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
