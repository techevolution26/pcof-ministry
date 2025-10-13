'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchMinisterById, deleteMinister } from '@/lib/adminApi'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faUserTie,
    faChurch,
    faCalendar,
    faCheckCircle,
    faTimesCircle,
    faEdit,
    faTrash,
    faSpinner,
    faUser,
    faIdCard
} from '@fortawesome/free-solid-svg-icons'

export default function MinisterShowPage() {
    const params = useParams() as { id?: string }
    const id = params?.id
    const router = useRouter()
    const [item, setItem] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (!id) return
        let mounted = true
            ; (async () => {
                try {
                    setLoading(true)
                    const res = await fetchMinisterById(id)
                    if (!mounted) return
                    setItem(res?.data ?? res)
                } catch (err) {
                    console.error(err)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [id])

    const handleDelete = async () => {
        if (!item || !confirm('Are you sure you want to delete this minister? This action cannot be undone.')) return

        setDeleting(true)
        try {
            await deleteMinister(item.id)
            router.push('/admin/ministers')
        } catch (error) {
            console.error('Failed to delete minister:', error)
            alert('Failed to delete minister. Please try again.')
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
                <div className="text-center">
                    <FontAwesomeIcon
                        icon={faSpinner}
                        className="mx-auto mb-4 text-2xl text-blue-600 animate-spin"
                    />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Loading minister details...
                    </div>
                </div>
            </div>
        )
    }

    if (!item) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <FontAwesomeIcon icon={faUserTie} className="text-4xl text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Minister Not Found</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">The minister you're looking for doesn't exist.</p>
                        <Link
                            href="/admin/ministers"
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            Back to Ministers
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const memberName = item.member ? `${item.member.first_name} ${item.member.last_name}` : `Minister #${item.id}`

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/admin/ministers"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
                                >
                                    <FontAwesomeIcon
                                        icon={faArrowLeft}
                                        className="text-sm group-hover:-translate-x-1 transition-transform"
                                    />
                                    <span className="text-sm font-medium">Back to Ministers</span>
                                </Link>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                Minister Details
                            </h1>
                            {item.title && (
                                <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                                    {item.title}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                {memberName.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Minister Profile</div>
                                <div className={`text-xs font-medium ${item.active
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                    {item.active ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Minister Information */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <FontAwesomeIcon icon={faUserTie} className="text-blue-500 text-lg" />
                                Minister Information
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                    <FontAwesomeIcon icon={faUser} className="text-blue-500 text-lg w-6" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Minister Name</div>
                                        <div className="font-semibold text-gray-900 dark:text-white text-lg">
                                            {memberName}
                                        </div>
                                    </div>
                                </div>

                                {item.member?.email && (
                                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                        <FontAwesomeIcon icon={faIdCard} className="text-green-500 text-lg w-6" />
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Contact Email</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {item.member.email}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                    <FontAwesomeIcon icon={faChurch} className="text-purple-500 text-lg w-6" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Department</div>
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {item.department?.name || <span className="text-gray-400 italic">Not assigned</span>}
                                        </div>
                                    </div>
                                </div>

                                {item.title && (
                                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                        <FontAwesomeIcon icon={faUserTie} className="text-orange-500 text-lg w-6" />
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Title / Role</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {item.title}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline Information */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <FontAwesomeIcon icon={faCalendar} className="text-green-500 text-lg" />
                                Service Timeline
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                    <FontAwesomeIcon icon={faCalendar} className="text-blue-500 text-lg w-6" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Started</div>
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {item.started_at
                                                ? new Date(item.started_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : <span className="text-gray-400 italic">Not specified</span>
                                            }
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                    <FontAwesomeIcon icon={faCalendar} className="text-red-500 text-lg w-6" />
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Ended</div>
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                            {item.ended_at
                                                ? new Date(item.ended_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })
                                                : <span className="text-gray-400 italic">Present</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Minister Status</h3>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${item.active
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                <FontAwesomeIcon icon={item.active ? faCheckCircle : faTimesCircle} />
                                {item.active ? 'Active Minister' : 'Inactive Minister'}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {item.active
                                    ? 'This minister is currently active in their role.'
                                    : 'This minister is no longer active in their role.'
                                }
                            </p>
                        </div>

                        {/* Actions Card */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href={`/admin/ministers/${item.id}/edit`}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                    Edit Minister
                                </Link>

                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="w-full py-3 px-4 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleting ? (
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                    ) : (
                                        <FontAwesomeIcon icon={faTrash} />
                                    )}
                                    Delete Minister
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Information</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Member ID</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">#{item.member_id}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Minister ID</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">#{item.id}</span>
                                </div>
                                {item.department && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Department ID</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">#{item.department.id}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}