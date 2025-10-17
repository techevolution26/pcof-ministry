'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { fetchAdminUser, approveUser, revokeUser, fetchRoles, assignRoleToUser, removeRoleFromUser } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faSpinner,
    faCheckCircle,
    faTimesCircle,
    faShield,
    faUser,
    faEnvelope,
    faCalendar,
    faCheck,
} from '@fortawesome/free-solid-svg-icons'

export default function AdminUserShow() {
    const { id } = useParams() as { id?: string }
    const router = useRouter()
    const [user, setUser] = useState<unknown | null>(null)
    const [roles, setRoles] = useState<unknown[]>([])
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        let mounted = true
            ; (async () => {
                setLoading(true)
                try {
                    const u = await fetchAdminUser(id)
                    if (!mounted) return
                    setUser(u?.data ?? u)
                    const r = await fetchRoles().catch(() => [])
                    if (!mounted) return
                    setRoles(r)
                } catch (error) {
                    console.error('Failed to load user:', error)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [id])

    const handleRoleToggle = async (roleName: string, currentlyHas: boolean) => {
        if (!user) return
        setActionLoading(roleName)
        try {
            if (currentlyHas) {
                await removeRoleFromUser(user.id, roleName)
            } else {
                await assignRoleToUser(user.id, roleName)
            }
            // Refresh user data
            const refreshed = await fetchAdminUser(user.id)
            setUser(refreshed?.data ?? refreshed)
        } catch (error) {
            console.error('Failed to update role:', error)
        } finally {
            setActionLoading(null)
        }
    }

    const handleStatusToggle = async () => {
        if (!user) return
        setActionLoading('status')
        try {
            if (user.is_active) {
                await revokeUser(user.id)
            } else {
                await approveUser(user.id)
            }
            router.push('/admin/users')
        } catch (error) {
            console.error('Failed to update user status:', error)
            setActionLoading(null)
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
                        Loading user details...
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <FontAwesomeIcon icon={faUser} className="text-4xl text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User Not Found</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">The user you&apos;re looking for doesn&apos;t exist.</p>
                        <Link
                            href="/admin/users"
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} />
                            Back to Users
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/admin/users"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
                                >
                                    <FontAwesomeIcon
                                        icon={faArrowLeft}
                                        className="text-sm group-hover:-translate-x-1 transition-transform"
                                    />
                                    <span className="text-sm font-medium">Back to Users</span>
                                </Link>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                User Details
                            </h1>
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">User Profile</div>
                                <div className={`text-xs font-medium ${user.is_active
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-orange-600 dark:text-orange-400'
                                    }`}>
                                    {user.is_active ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Info Card */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                <FontAwesomeIcon icon={faUser} className="text-blue-500 text-lg" />
                                Basic Information
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                    <FontAwesomeIcon icon={faUser} className="text-gray-400 text-lg w-6" />
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Name</div>
                                        <div className="font-semibold text-gray-900 dark:text-white">{user.name}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                    <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 text-lg w-6" />
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                                        <div className="font-semibold text-gray-900 dark:text-white">{user.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                    <FontAwesomeIcon icon={faCalendar} className="text-gray-400 text-lg w-6" />
                                    <div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                                        <div className={`font-semibold ${user.is_active
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-orange-600 dark:text-orange-400'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Pending Approval'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Role Management */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                                <FontAwesomeIcon icon={faShield} className="text-purple-500 text-lg" />
                                Role Management
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                                Assign or remove roles to control user permissions and access levels.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {roles.map((r) => {
                                    const hasRole = (user.roles || []).includes(r.name)
                                    return (
                                        <button
                                            key={r.id}
                                            onClick={() => handleRoleToggle(r.name, hasRole)}
                                            disabled={actionLoading === r.name}
                                            className={`p-4 rounded-2xl transition-all duration-200 flex items-center justify-between group ${hasRole
                                                ? 'bg-indigo-50 border-2 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700'
                                                : 'bg-gray-50 border-2 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600'
                                                } ${actionLoading === r.name ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasRole
                                                    ? 'bg-indigo-500 text-white'
                                                    : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                                    }`}>
                                                    <FontAwesomeIcon icon={faShield} />
                                                </div>
                                                <div className="text-left">
                                                    <div className={`font-semibold ${hasRole
                                                        ? 'text-indigo-700 dark:text-indigo-300'
                                                        : 'text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {r.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${hasRole
                                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                                : 'border-gray-300 dark:border-gray-500'
                                                }`}>
                                                {hasRole && <FontAwesomeIcon icon={faCheck} className="text-xs" />}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Actions Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Status</h3>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${user.is_active
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                }`}>
                                <FontAwesomeIcon icon={user.is_active ? faCheckCircle : faTimesCircle} />
                                {user.is_active ? 'Active User' : 'Pending Approval'}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {user.is_active
                                    ? 'This user has active access to the system.'
                                    : 'This user is waiting for approval to access the system.'
                                }
                            </p>
                            <button
                                onClick={handleStatusToggle}
                                disabled={actionLoading === 'status'}
                                className={`w-full py-3 px-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${user.is_active
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                                    } ${actionLoading === 'status' ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                            >
                                {actionLoading === 'status' ? (
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                ) : user.is_active ? (
                                    <>
                                        <FontAwesomeIcon icon={faTimesCircle} />
                                        Revoke Access
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        Approve User
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Role Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Roles</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{roles.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Assigned Roles</span>
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                        {(user.roles || []).length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}