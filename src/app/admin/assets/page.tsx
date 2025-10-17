// /src/app/admin/assets/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAssets, deleteAsset } from '@/lib/adminApi'
import { useRouter } from 'next/navigation'

type Asset = {
    id: number | string
    name?: string | null
    asset_tag?: string | null
    church?: { name?: string } | null
    church_id?: number | string | null
    location?: string | null
    file_url?: string | null
}

/** Meta shape we expect (may come from different APIs) */
type Meta = {
    total?: number | string
    last_page?: number | string
    lastPage?: number | string
    per_page?: number | string
}

/** Safely unwraps values like `{ data: ... }` returned by some APIs */
function extractData<T>(val: unknown): T | undefined {
    if (!val || typeof val !== 'object') return val as T | undefined
    const obj = val as Record<string, unknown>
    if ('data' in obj) {
        const d = obj['data']
        return d as T | undefined
    }
    return val as T | undefined
}

/** Safely extract meta/pagination object from API response */
function extractMeta(val: unknown): Meta | null {
    if (!val || typeof val !== 'object') return null
    const obj = val as Record<string, unknown>
    const metaCandidate = obj['meta'] ?? obj['pagination']
    if (metaCandidate && typeof metaCandidate === 'object') {
        return metaCandidate as Meta
    }
    return null
}

/** safe number coercion */
function toNumber(v: unknown, fallback = 0) {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
}

export default function AdminAssetsPage() {
    const router = useRouter()
    const [items, setItems] = useState<Asset[]>([])
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
            setLoading(true)
            setError(null)
            try {
                const body = await fetchAssets({ q: debouncedQ || undefined, page, per_page: perPage })

                // API may return an array or an object like { data: [...], meta: {...} }
                const list = Array.isArray(body) ? (body as Asset[]) : (extractData<Asset[]>(body) ?? [])
                if (!mounted) return
                setItems(Array.isArray(list) ? list : [])

                const meta = extractMeta(body)
                const computedTotal = meta?.total ?? (Array.isArray(list) ? list.length : 0)
                setTotal(toNumber(computedTotal, Array.isArray(list) ? list.length : 0))

                const lpCandidate = meta?.last_page ?? meta?.lastPage
                const perPageCandidate = meta?.per_page ?? perPage
                const lp = lpCandidate ?? Math.ceil((toNumber(meta?.total ?? 0) || 0) / (toNumber(perPageCandidate, perPage) || perPage))
                setLastPage(Math.max(1, toNumber(lp, 1)))
            } catch (err: unknown) {
                if (!mounted) return
                // keep console for dev debugging
                console.error(err)
                setError((err as { message?: string })?.message ?? 'Failed to load assets')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
        // router included intentionally to avoid stale navigation references if used elsewhere
    }, [debouncedQ, page, perPage, router])

    async function handleDelete(id: number | string) {
        if (!confirm('Delete this asset?')) return
        try {
            await deleteAsset(id)
            setItems(prev => prev.filter(x => String(x.id) !== String(id)))
            setTotal(t => Math.max(0, t - 1))
        } catch (err: unknown) {
            alert((err as { message?: string })?.message ?? 'Delete failed')
        }
    }

    function gotoPage(p: number) {
        setPage(p < 1 ? 1 : p > lastPage ? lastPage : p)
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // show error if present (prevents "assigned but never used")
    if (error) {
        return <div className="text-red-600 p-4">{error}</div>
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
                                {items.map((a) => (
                                    <tr key={String(a.id)} className="border-t last:border-b">
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
