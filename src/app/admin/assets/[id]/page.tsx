'use client'
import React, { useEffect, useState } from 'react'
import { fetchAssetById } from '@/lib/adminApi'
import Link from 'next/link'

function normalizeFileUrl(url?: string | null) {
    if (!url) return null
    if (/^https?:\/\//.test(url)) return url
    // NEXT_PUBLIC_API_URL e.g. http://localhost:8000
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
    if (!base) return url
    // if url already starts with a slash, just join
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export default function AssetShowPage({ params }: { params: any }) {
    const [asset, setAsset] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

            ; (async () => {
                try {
                    // resolve params (in newer Next params may be a Promise)
                    const resolved = await Promise.resolve(params)
                    const id = resolved?.id
                    if (!id) {
                        if (mounted) setAsset(null)
                        return
                    }

                    const body = await fetchAssetById(id)
                    const data = body?.data ?? body

                    // normalize file_url for the frontend
                    if (data?.file_url) data.file_url = normalizeFileUrl(data.file_url)

                    if (!mounted) return
                    setAsset(data)
                } catch (err) {
                    console.error('Failed to load asset', err)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()

        return () => {
            mounted = false
        }
        // note: we depend on `params` itself, not `params.id` (avoid direct property access)
    }, [params])

    if (loading) return <div>Loading…</div>
    if (!asset) return <div>Asset not found</div>

    return (
        <div className="bg-white p-6 rounded shadow">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold">{asset.name}</h1>
                    <div className="text-sm text-gray-500">{asset.asset_tag ?? ''}</div>
                </div>
                <div>
                    <Link href={`/admin/assets/${asset.id}/edit`} className="text-sky-600">Edit</Link>
                </div>
            </div>

            <dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <dt className="text-xs text-gray-500">Church</dt>
                    <dd>{asset.church?.name ?? '—'}</dd>
                </div>
                <div>
                    <dt className="text-xs text-gray-500">Location</dt>
                    <dd>{asset.location ?? '—'}</dd>
                </div>
                <div className="md:col-span-2">
                    <dt className="text-xs text-gray-500">Description</dt>
                    <dd>{asset.description ?? '—'}</dd>
                </div>

                <div className="md:col-span-2">
                    <dt className="text-xs text-gray-500">File</dt>
                    <dd>
                        {asset.file_url ? (
                            asset.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={asset.file_url} alt={asset.name} className="max-h-64 rounded border" />
                            ) : (
                                <a href={asset.file_url} className="text-sky-600" target="_blank" rel="noreferrer">Download file</a>
                            )
                        ) : '—'}
                    </dd>
                </div>
            </dl>
        </div>
    )
}
