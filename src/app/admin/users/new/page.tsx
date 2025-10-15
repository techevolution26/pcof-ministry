// src/app/admin/users/new/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchRoles } from '@/lib/adminApi'
import { createUser } from '@/lib/adminApi'
import ChurchTypeahead from '@/components/ChurchTypeahead'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faUser,
    faEnvelope,
    faLock,
    faShield,
    faUserPlus,
    faSpinner,
    faCheckCircle,
    faInfoCircle,
    faLightbulb,
    faUsers,
    faChurch
} from '@fortawesome/free-solid-svg-icons'

interface FormData {
    name: string
    email: string
    password: string
    confirmPassword: string
    roles: string[]
    church_id?: number | string | null
}

export default function AdminUserCreatePage() {
    const router = useRouter()
    const { user } = useAdminAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [roles, setRoles] = useState<any[]>([])
    const [rolesLoading, setRolesLoading] = useState(true)
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        roles: [],
        church_id: null,
    })
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    setRolesLoading(true)
                    const r = await fetchRoles()
                    if (!mounted) return
                    setRoles(Array.isArray(r) ? r : (r?.data ?? []))
                } catch (err) {
                    console.error('Failed to load roles', err)
                    setError('Failed to load available roles')
                } finally {
                    if (mounted) setRolesLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value, type } = e.target as HTMLInputElement
        setFormData(prev => ({ ...prev, [name]: value }))
        if (error) setError(null)
        if (Object.keys(fieldErrors).length) setFieldErrors({})
    }

    function handleRoleToggle(roleName: string) {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(roleName) ? prev.roles.filter(r => r !== roleName) : [...prev.roles, roleName]
        }))
    }

    function onSelectChurch(church: any | null) {
        setFormData(prev => ({ ...prev, church_id: church ? church.id : null }))
        if (fieldErrors['church_id']) setFieldErrors(prev => { const cp = { ...prev }; delete cp['church_id']; return cp })
    }

    const fieldError = (k: string) => fieldErrors?.[k] ? <div className="text-red-600 text-sm mt-1">{fieldErrors[k].join(' ')}</div> : null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setFieldErrors({})
        setLoading(true)

        // client-side validations
        if (formData.password !== formData.confirmPassword) {
            setFieldErrors({ password: ['Passwords do not match'] })
            setLoading(false)
            return
        }
        if (formData.password.length < 6) {
            setFieldErrors({ password: ['Password must be at least 6 characters long'] })
            setLoading(false)
            return
        }
        if (!formData.name.trim() || !formData.email.trim()) {
            setError('Please fill in all required fields')
            setLoading(false)
            return
        }

        try {
            await createUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.confirmPassword,
                roles: formData.roles,
                church_id: formData.church_id ?? null,
            });

            router.push('/admin/users')
            router.refresh()
        } catch (err: any) {
            console.error('create user failed', err)
            if (err?.status === 422 && err.errors) {
                setFieldErrors(err.errors)
            } else {
                setError(err?.message ?? 'Failed to create user')
            }
        } finally {
            setLoading(false)
        }
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
                                Create New User
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                                Add a new user to the system with appropriate roles and permissions
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faUserPlus} className="text-white text-lg" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Form */}
                <section>
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                        <div className="p-6">
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                                    <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
                                        <FontAwesomeIcon icon={faInfoCircle} />
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Information Section */}
                                <div className="bg-white dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faUser} className="text-blue-500" />
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Full Name *
                                            </label>
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                                                placeholder="Enter full name"
                                            />
                                            {fieldError('name')}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Email Address *
                                            </label>
                                            <input
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                type="email"
                                                required
                                                className="w-full p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                                                placeholder="Enter email address"
                                            />
                                            {fieldError('email')}
                                        </div>
                                    </div>
                                </div>

                                {/* Church Assignment Section */}
                                <div className="bg-white dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faChurch} className="text-purple-500" />
                                        Church Assignment
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Assign to Church (Optional)
                                        </label>
                                        <div className="max-w-md">
                                            <ChurchTypeahead
                                                value={formData.church_id ?? ''}
                                                onSelect={onSelectChurch}
                                                placeholder="Search churches by name..."
                                            />
                                        </div>
                                        {fieldError('church_id')}
                                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <FontAwesomeIcon icon={faInfoCircle} className="text-sm" />
                                            <span>Leave empty to create a system admin user</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Section */}
                                <div className="bg-white dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faLock} className="text-green-500" />
                                        Security Settings
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Password *
                                            </label>
                                            <input
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                type="password"
                                                minLength={6}
                                                required
                                                className="w-full p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                                                placeholder="Enter password"
                                            />
                                            {fieldError('password')}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Confirm Password *
                                            </label>
                                            <input
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                type="password"
                                                required
                                                className="w-full p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                                                placeholder="Confirm password"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <FontAwesomeIcon icon={faLightbulb} className="text-sm" />
                                        <span>Password must be at least 6 characters long</span>
                                    </div>
                                </div>

                                {/* Roles Section */}
                                <div className="bg-white dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faShield} className="text-orange-500" />
                                        User Roles & Permissions
                                    </h3>
                                    {rolesLoading ? (
                                        <div className="flex items-center justify-center p-4">
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-600 mr-2" />
                                            <span className="text-gray-600 dark:text-gray-400">Loading roles...</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {roles.map((r: any) => (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    onClick={() => handleRoleToggle(r.name)}
                                                    className={`p-4 text-left rounded-2xl border-2 transition-all duration-200 ${formData.roles.includes(r.name)
                                                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 shadow-sm'
                                                        : 'bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500 hover:border-gray-300 dark:hover:border-gray-400'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {r.name}
                                                        </div>
                                                        {formData.roles.includes(r.name) && (
                                                            <FontAwesomeIcon
                                                                icon={faCheckCircle}
                                                                className="text-green-500 text-lg"
                                                            />
                                                        )}
                                                    </div>
                                                    {r.description && (
                                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                            {r.description}
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {roles.length === 0 && !rolesLoading && (
                                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                            No roles available
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <FontAwesomeIcon icon={faInfoCircle} />
                                        <span>Fields marked with * are required</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Link
                                            href="/admin/users"
                                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl transition-all duration-200 text-center"
                                        >
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                                    Creating User...
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faUserPlus} />
                                                    Create User
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}