// app/admin/church/departments/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchDepartments } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faPlus,
    faUsers,
    faEdit,
    faEye,
    faSpinner,
    faBuilding,
    faFileAlt
} from '@fortawesome/free-solid-svg-icons'

export default function ChurchDepartmentsPage() {
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [rows, setRows] = useState<unknown[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        if (!churchId) return () => { mounted = false }
            ; (async () => {
                setLoading(true)
                try {
                    const body = await fetchDepartments({ church_id: churchId, per_page: 100 })
                    if (!mounted) return
                    const list = Array.isArray(body) ? body : (body?.data ?? [])
                    setRows(list)
                    setError(null)
                } catch (err: unknown) {
                    if (!mounted) return
                    setError(err?.message ?? 'Failed to load departments')
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [churchId])

    if (isLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading departments...</div>
                </div>
            </div>
        </div>
    )

    if (!churchId) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-red-200/50 dark:border-red-700/50">
                    <div className="text-red-600 dark:text-red-400 text-center">
                        No church assigned to your account. Please contact an administrator.
                    </div>
                </div>
            </div>
        </div>
    )

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading departments...</div>
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
                            Church Departments
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Manage and organize your church departments and ministries
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href="/admin/church/departments/new"
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <FontAwesomeIcon icon={faPlus} className="text-sm" />
                            <span className="text-sm font-medium">New Department</span>
                        </Link>
                    </div>
                </div>

                {/* Departments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rows.map((department) => (
                        <div
                            key={department.id}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                        <FontAwesomeIcon icon={faBuilding} className="text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                            {department.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            <FontAwesomeIcon icon={faUsers} className="text-xs" />
                                            <span>Department</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {department.description && (
                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                                    {department.description}
                                </p>
                            )}

                            {!department.description && (
                                <div className="text-gray-400 dark:text-gray-500 text-sm mb-4 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faFileAlt} className="text-xs" />
                                    No description provided
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    ID: {department.id}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/church/departments/${department.id}/edit`}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors duration-200"
                                    >
                                        <FontAwesomeIcon icon={faEdit} className="text-xs" />
                                        Edit
                                    </Link>
                                    <Link
                                        href={`/admin/church/departments/${department.id}`}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                                    >
                                        <FontAwesomeIcon icon={faEye} className="text-xs" />
                                        View
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {rows.length === 0 && (
                        <div className="col-span-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                <FontAwesomeIcon icon={faBuilding} className="text-4xl mb-4 text-gray-300 dark:text-gray-600" />
                                <div className="text-lg font-medium mb-2">No departments yet</div>
                                <div className="text-sm mb-6 max-w-md">
                                    Departments help you organize different ministries and teams within your church.
                                </div>
                                <Link
                                    href="/admin/church/departments/new"
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    Create Your First Department
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                {rows.length > 0 && (
                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/50 dark:border-gray-700/50">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{rows.length}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Total Departments</div>
                            </div>
                            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                            <div className="text-center">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Church Organization
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Manage your ministries</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}