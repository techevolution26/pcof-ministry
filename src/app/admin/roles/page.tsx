'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchRoles, createRole, deleteRole } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUsersCog,
    faPlus,
    faTrash,
    faSpinner,
    faArrowLeft,
    faShield
} from '@fortawesome/free-solid-svg-icons'

export default function AdminRolesPage() {
    const [roles, setRoles] = useState<unknown[]>([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                const r = await fetchRoles().catch(() => [])
                if (mounted) setRoles(r)
                setLoading(false)
            })()
        return () => { mounted = false }
    }, [])

    async function handleCreate() {
        if (!name.trim()) return
        setIsSubmitting(true)
        const r = await createRole({ name }).catch(e => {
            alert(e?.message || 'Error creating role')
        })
        if (r) {
            setRoles(prev => [...prev, r])
            setName('')
        }
        setIsSubmitting(false)
    }

    const handleDelete = async (roleId: string, roleName: string) => {
        if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) return

        await deleteRole(roleId)
        setRoles(prev => prev.filter(x => x.id !== roleId))
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
                        Loading roles...
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
                                    href="/admin"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
                                >
                                    <FontAwesomeIcon
                                        icon={faArrowLeft}
                                        className="text-sm group-hover:-translate-x-1 transition-transform"
                                    />
                                    <span className="text-sm font-medium">Back to Dashboard</span>
                                </Link>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                Role Management
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                                Create and manage user roles and permissions
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faShield} className="text-white text-lg" />
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Roles</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{roles.length} total</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Create Role Section */}
                <section className="mb-8">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                            <FontAwesomeIcon icon={faPlus} className="text-green-500 text-lg" />
                            Create New Role
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Enter role name (e.g., 'Moderator', 'Editor')"
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                                />
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={!name.trim() || isSubmitting}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                ) : (
                                    <FontAwesomeIcon icon={faPlus} />
                                )}
                                Create Role
                            </button>
                        </div>
                    </div>
                </section>

                {/* Roles List Section */}
                <section>
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                                <FontAwesomeIcon icon={faUsersCog} className="text-blue-500 text-lg" />
                                Existing Roles ({roles.length})
                            </h2>
                        </div>

                        {roles.length === 0 ? (
                            <div className="text-center py-12 px-6">
                                <FontAwesomeIcon
                                    icon={faUsersCog}
                                    className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-4"
                                />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No roles created yet
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                    Create your first role to get started with role-based access control in your organization.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {roles.map((role) => (
                                    <div
                                        key={role.id}
                                        className="p-6 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center">
                                                    <FontAwesomeIcon
                                                        icon={faShield}
                                                        className="text-blue-600 dark:text-blue-400 text-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {role.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        Role ID: {role.id}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDelete(role.id, role.name)}
                                                    className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all duration-200 group/delete"
                                                    title="Delete role"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faTrash}
                                                        className="group-hover/delete:scale-110 transition-transform"
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Roles help you manage permissions and access levels for different users in your organization.
                    </p>
                </div>
            </div>
        </div>
    )
}