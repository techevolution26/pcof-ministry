// app/admin/church/assets/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchChurchAssets } from '@/lib/adminApi'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faPlus,
    faBuilding,
    faMapMarkerAlt,
    faTag,
    faSpinner,
    faBox,
    faTools,
    faCalendar,
    faIdCard
} from '@fortawesome/free-solid-svg-icons'

export default function ChurchAssetsPage() {
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const churchId = user?.church_id

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            setError(null)
            try {
                if (!churchId) {
                    setItems([]);
                    return
                }
                const body = await fetchChurchAssets(churchId)
                if (!mounted) return
                setItems(Array.isArray(body) ? body : (body?.data ?? []))
            } catch (err: any) {
                console.error(err)
                if (!mounted) return
                setError(err?.message ?? 'Failed to load assets')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [churchId, isLoading])

    if (isLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading assets...</div>
                </div>
            </div>
        </div>
    )

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading assets...</div>
                </div>
            </div>
        </div>
    )

    if (error) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-red-200/50 dark:border-red-700/50">
                    <div className="text-red-600 dark:text-red-400 text-center">{error}</div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                    <div className="space-y-2">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                            Church Assets
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Manage and track your church's physical assets and equipment
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/admin/church/assets/new"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-sm" />
                            <span className="text-sm font-medium">Add Asset</span>
                        </Link>
                    </div>
                </div>

                {/* Assets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((asset) => (
                        <div
                            key={asset.id}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <FontAwesomeIcon icon={faBox} className="text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                            {asset.name || 'Unnamed Asset'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            <FontAwesomeIcon icon={faBuilding} className="text-xs" />
                                            <span>Church Asset</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Asset Details */}
                            <div className="space-y-3 mb-4">
                                {asset.asset_tag && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                            <FontAwesomeIcon icon={faTag} className="text-orange-600 dark:text-orange-400 text-sm" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Asset Tag</div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {asset.asset_tag}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {asset.location && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600 dark:text-blue-400 text-sm" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {asset.location}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {asset.category && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                            <FontAwesomeIcon icon={faTools} className="text-green-600 dark:text-green-400 text-sm" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Category</div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                                {asset.category}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Asset Description */}
                            {asset.description && (
                                <div className="mb-4">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                        {asset.description}
                                    </p>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <FontAwesomeIcon icon={faIdCard} className="text-xs" />
                                    <span>ID: {asset.id}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {asset.purchase_date && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                                            {new Date(asset.purchase_date).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="col-span-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                <FontAwesomeIcon icon={faBox} className="text-4xl mb-4 text-gray-300 dark:text-gray-600" />
                                <div className="text-lg font-medium mb-2">No assets yet</div>
                                <div className="text-sm mb-6 max-w-md">
                                    Track your church's physical assets like equipment, furniture, and other property to maintain proper inventory.
                                </div>
                                <Link
                                    href="/admin/church/assets/new"
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    Add Your First Asset
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                {items.length > 0 && (
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/50 dark:border-gray-700/50">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{items.length}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Total Assets</div>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="text-center">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Asset Management
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Track church property</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}