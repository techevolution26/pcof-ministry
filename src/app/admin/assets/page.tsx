'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAssets, deleteAsset } from '@/lib/adminApi'
import { useRouter } from 'next/navigation'

export default function AdminAssetsPage() {
    const router = useRouter()
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [q, setQ] = useState('')
    const [debouncedQ, setDebouncedQ] = useState('')
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(20)
    const [total, setTotal] = useState(0)
    const [lastPage, setLastPage] = useState(1)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 300)
        return () => clearTimeout(t)
    }, [q])

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true); setError(null)
            try {
                const body = await fetchAssets({ q: debouncedQ || undefined, page, per_page: perPage })
                const list = Array.isArray(body) ? body : (body?.data ?? [])
                if (!mounted) return
                setItems(list)
                const meta = body?.meta ?? body?.pagination ?? null
                setTotal(meta?.total ?? (Array.isArray(list) ? list.length : 0))
                setLastPage(meta?.last_page ?? meta?.lastPage ?? Math.ceil((meta?.total ?? 0) / (meta?.per_page ?? perPage)))
            } catch (err: any) {
                if (!mounted) return
                console.error(err)
                setError(err?.message ?? 'Failed to load assets')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [debouncedQ, page, perPage, router])

    async function handleDelete(id: number | string) {
        if (!confirm('Delete this asset?')) return
        try {
            await deleteAsset(id)
            setItems(prev => prev.filter(x => String(x.id) !== String(id)))
            setTotal(t => Math.max(0, t - 1))
        } catch (err: any) {
            alert(err?.message ?? 'Delete failed')
        }
    }

    function gotoPage(p: number) {
        setPage(p < 1 ? 1 : p > lastPage ? lastPage : p)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Assets</h1>
                    <div className="text-sm text-gray-500">Manage assets and files</div>
                </div>
                <Link href="/admin/assets/new" className="px-3 py-2 bg-sky-600 text-white rounded shadow">Upload asset</Link>
            </div>

            <div className="mb-4 flex items-center gap-2">
                <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Search assets..." className="p-2 border rounded w-full sm:w-96" />
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }} className="p-2 border rounded">
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>

            <div className="bg-white rounded shadow overflow-auto">
                <table className="w-full text-left text-sm min-w-[720px]">
                    <thead className="text-xs text-gray-500 bg-gray-50 sticky top-0">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Church</th>
                            <th className="p-3">Location</th>
                            <th className="p-3">File</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: perPage > 20 ? 10 : perPage }).map((_, i) => (
                                <tr key={i} className="border-t">
                                    <td className="p-3"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="p-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="p-3"><div className="h-4 w-28 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="p-3"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
                                    <td className="p-3"><div className="h-4 w-36 bg-gray-200 rounded animate-pulse" /></td>
                                </tr>
                            ))
                        ) : (
                            <>
                                {items.map(a => (
                                    <tr key={a.id} className="border-t last:border-b">
                                        <td className="p-3">
                                            <div className="font-medium">{a.name}</div>
                                            {a.asset_tag && <div className="text-xs text-gray-400">{a.asset_tag}</div>}
                                        </td>
                                        <td className="p-3">{a.church?.name ?? '—'}</td>
                                        <td className="p-3">{a.location ?? '—'}</td>
                                        <td className="p-3">
                                            {a.file_url ? (
                                                <a href={a.file_url} target="_blank" rel="noreferrer" className="text-sky-600 text-sm">Open file</a>
                                            ) : '—'}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2 items-center">
                                                <Link href={`/admin/assets/${a.id}`} className="text-sky-600 text-sm">View</Link>
                                                <Link href={`/admin/assets/${a.id}/edit`} className="text-gray-600 text-sm">Edit</Link>
                                                <button onClick={() => handleDelete(a.id)} className="text-red-600 text-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr><td colSpan={5} className="p-6 text-center text-gray-500">No assets found.</td></tr>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">Showing <strong>{items.length}</strong> of <strong>{total}</strong></div>
                <div className="flex items-center gap-2">
                    <button onClick={() => gotoPage(1)} disabled={page <= 1} className="px-3 py-1 border rounded">First</button>
                    <button onClick={() => gotoPage(page - 1)} disabled={page <= 1} className="px-3 py-1 border rounded">Prev</button>
                    <div className="px-3 py-1 border rounded">{page} / {lastPage}</div>
                    <button onClick={() => gotoPage(page + 1)} disabled={page >= lastPage} className="px-3 py-1 border rounded">Next</button>
                    <button onClick={() => gotoPage(lastPage)} disabled={page >= lastPage} className="px-3 py-1 border rounded">Last</button>
                </div>
            </div>
        </div>
    )
}
