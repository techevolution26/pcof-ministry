// app/admin/church/designations/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchDesignations } from '@/lib/adminApi'

export default function ChurchDesignationsPage() {
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        if (!churchId) return () => { mounted = false }
            ; (async () => {
                setLoading(true)
                try {
                    const body = await fetchDesignations({ church_id: churchId, per_page: 100 })
                    if (!mounted) return
                    const list = Array.isArray(body) ? body : (body?.data ?? [])
                    setRows(list)
                } catch (err: any) {
                    if (!mounted) return
                    setError(err?.message ?? 'Failed to load designations')
                } finally { if (mounted) setLoading(false) }
            })()
        return () => { mounted = false }
    }, [churchId])

    if (isLoading || loading) return <div className="p-6 text-gray-500">Loading…</div>
    if (!churchId) return <div className="p-6 text-red-600">No church associated with your account.</div>
    if (error) return <div className="p-6 text-red-600">{error}</div>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold">Designations ({rows.length})</h1>
                <Link href="/admin/church/designations/new" className="px-3 py-1 bg-sky-600 text-white rounded text-sm">New designation</Link>
            </div>

            <div className="bg-white rounded shadow overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs text-gray-500">
                        <tr><th className="p-2">Name</th><th className="p-2">Actions</th></tr>
                    </thead>
                    <tbody>
                        {rows.map(d => (
                            <tr key={d.id} className="border-t">
                                <td className="p-2">{d.name}</td>
                                <td className="p-2">
                                    <Link href={`/admin/church/designations/${d.id}/edit`} className="text-sky-600 mr-3">Edit</Link>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && <tr><td colSpan={2} className="p-4 text-gray-500">No designations yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
