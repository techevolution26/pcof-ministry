'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchDesignationsList, deleteDesignation } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faPlus,
    faUserTie,
    faEye,
    faEdit,
    faTrash,
    faSpinner,
    faIdCard,
    faFileAlt
} from '@fortawesome/free-solid-svg-icons'

export default function AdminDesignationsPage() {
    const router = useRouter()
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | number | null>(null)

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

    const handleDelete = async (id: string | number) => {
        if (!confirm('Are you sure you want to delete this designation? This action cannot be undone.')) return

        setDeletingId(id)
        try {
            await deleteDesignation(id)
            setItems(prev => prev.filter(x => x.id !== id))
        } catch (err: any) {
            alert(err?.message ?? 'Failed to delete designation')
        } finally {
            setDeletingId(null)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading designations...</div>
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
                            Designations
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Manage roles and titles for church members and staff
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/admin/designations/new"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-sm" />
                            <span className="text-sm font-medium">Create Designation</span>
                        </Link>
                    </div>
                </div>

                {/* Designations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((designation) => (
                        <div
                            key={designation.id}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <FontAwesomeIcon icon={faUserTie} className="text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                            {designation.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            <FontAwesomeIcon icon={faIdCard} className="text-xs" />
                                            <span>Designation</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {designation.description && (
                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                                    {designation.description}
                                </p>
                            )}

                            {!designation.description && (
                                <div className="text-gray-400 dark:text-gray-500 text-sm mb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faFileAlt} className="text-xs" />
                                    No description provided
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    ID: {designation.id}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/designations/${designation.id}`}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors duration-200"
                                    >
                                        <FontAwesomeIcon icon={faEye} className="text-xs" />
                                        View
                                    </Link>
                                    <Link
                                        href={`/admin/designations/${designation.id}/edit`}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                                    >
                                        <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(designation.id)}
                                        disabled={deletingId === designation.id}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/50 dark:bg-gray-700/50 border border-red-200/50 dark:border-red-600/50 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {deletingId === designation.id ? (
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                                        ) : (
                                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                        )}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {items.length === 0 && (
                        <div className="col-span-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                <FontAwesomeIcon icon={faUserTie} className="text-4xl mb-4 text-gray-300 dark:text-gray-600" />
                                <div className="text-lg font-medium mb-2">No designations yet</div>
                                <div className="text-sm mb-6 max-w-md">
                                    Designations help you organize roles and titles for your church members and staff.
                                </div>
                                <Link
                                    href="/admin/designations/new"
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    Create Your First Designation
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
                                <div className="text-xs text-gray-500 dark:text-gray-400">Total Designations</div>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="text-center">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Role Management
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Organize church roles</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}