// /src/app/admin/assets/[id]/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { fetchAssetById } from '@/lib/adminApi'
import Link from 'next/link'
import Image from 'next/image'

type Asset = {
    id: number | string
    name?: string
    asset_tag?: string
    church?: { name?: string } | null
    church_id?: number | string
    location?: string | null
    description?: string | null
    file_url?: string | null
}

/** Safely unwrapping values like `{ data: ... }` returned by APIs */
function extractData<T>(val: unknown): T | undefined {
    if (val && typeof val === 'object') {
        const obj = val as Record<string, unknown>
        if ('data' in obj) {
            return obj['data'] as T
        }
    }
    return val as T | undefined
}

/** Safely getting id from unknown params -Next params can be objects or promises */
function params: unknown?.id: string | undefined {
    if (!params) return undefined
    if (typeof params === 'string' || typeof params === 'number') return String(params)
    if (typeof params === 'object') {
        const p = params as Record<string, unknown>
        const idVal = p['id']
        if (typeof idVal === 'string' || typeof idVal === 'number') return String(idVal)
    }
    return undefined
}

function normalizeFileUrl(url?: string | null) {
    if (!url) return null
    if (/^https?:\/\//.test(url)) return url
    // NEXT_PUBLIC_API_URL e.g. http://localhost:8000
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
    if (!base) return url
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export default function AssetShowPage({ params }: { params: unknown }) {
    const [asset, setAsset] = useState<Asset | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

            ; (async () => {
                try {
                    // resolving params in Next versions params may be a Promise
                    const resolved = await Promise.resolve(params)
                    const id = resolved?.id
                    if (!id) {
                        if (mounted) setAsset(null)
                        return
                    }

                    const body = await fetchAssetById(id)
                    const data = extractData<Asset>(body) ?? null

                    if (data && data.file_url) {
                        data.file_url = normalizeFileUrl(data.file_url)
                    }

                    if (!mounted) return
                    setAsset(data)
                } catch (err: unknown) {
                    // keeping console debuging to aid troubleshooting
                    console.error('Failed to load asset', err)
                    if (mounted) setAsset(null)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()

        return () => {
            mounted = false
        }
        // depending on `params` we intentionally avoid direct property access in the dependency list
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
                    <dd>{asset.church?.name ?? asset.church_id ?? '—'}</dd>
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
                                <div className="max-h-64 rounded border overflow-hidden">
                                    <Image
                                        src={asset.file_url}
                                        alt={asset.name ?? 'Asset file'}
                                        width={800}
                                        height={480}
                                        style={{ objectFit: 'cover', maxHeight: '16rem', width: '100%', height: 'auto' }}
                                        // remove the next line if you configured domains in next.config.js
                                        // unoptimized
                                        priority={false}
                                    />
                                </div>
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
