'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchRoles, } from '@/lib/adminApi' //createUser
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
    faCircle,
    faInfoCircle,
    faLightbulb
} from '@fortawesome/free-solid-svg-icons'

interface FormData {
    name: string
    email: string
    password: string
    confirmPassword: string
    roles: string[]
}

export default function AdminUserCreatePage() {
    const router = useRouter()
    const { user } = useAdminAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [roles, setRoles] = useState<any[]>([])
    const [rolesLoading, setRolesLoading] = useState(true)
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        roles: []
    })

    // Load available roles
    useEffect(() => {
        const loadRoles = async () => {
            try {
                setRolesLoading(true)
                const rolesData = await fetchRoles()
                setRoles(rolesData)
            } catch (error) {
                console.error('Failed to load roles:', error)
                setError('Failed to load available roles')
            } finally {
                setRolesLoading(false)
            }
        }
        loadRoles()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
        // Clear error when user starts typing
        if (error) setError('')
    }

    const handleRoleToggle = (roleName: string) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(roleName)
                ? prev.roles.filter(r => r !== roleName)
                : [...prev.roles, roleName]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long')
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
                roles: formData.roles
            })

            router.push('/admin/users')
            router.refresh()
        } catch (err: any) {
            console.error('Failed to create user:', err)
            setError(err.message || 'Failed to create user. Please try again.')
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
                                Add a new user to the system and assign roles
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faUserPlus} className="text-white text-lg" />
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">New User</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Setup</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-red-800 dark:text-red-200">
                            <FontAwesomeIcon icon={faInfoCircle} className="text-lg" />
                            <div>
                                <span className="font-medium">Error: </span>
                                <span>{error}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* Basic Information Section */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <FontAwesomeIcon icon={faUser} className="text-blue-500 text-lg" />
                                Basic Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name Field */}
                                <div className="space-y-3">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Full Name *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11"
                                            placeholder="Enter full name"
                                        />
                                        <FontAwesomeIcon
                                            icon={faUser}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div className="space-y-3">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Email Address *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11"
                                            placeholder="Enter email address"
                                        />
                                        <FontAwesomeIcon
                                            icon={faEnvelope}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Password Section */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <FontAwesomeIcon icon={faLock} className="text-green-500 text-lg" />
                                Security Settings
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Password Field */}
                                <div className="space-y-3">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11"
                                            placeholder="Enter password"
                                            minLength={6}
                                        />
                                        <FontAwesomeIcon
                                            icon={faLock}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Minimum 6 characters
                                    </p>
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-3">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Confirm Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11"
                                            placeholder="Confirm password"
                                        />
                                        <FontAwesomeIcon
                                            icon={faLock}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Roles Section */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <FontAwesomeIcon icon={faShield} className="text-purple-500 text-lg" />
                                Role Assignment
                            </h2>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Select User Roles
                                </label>

                                {rolesLoading ? (
                                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                        Loading available roles...
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {roles.map((role) => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => handleRoleToggle(role.name)}
                                                    className={`p-4 rounded-2xl border-2 transition-all duration-200 group text-left ${formData.roles.includes(role.name)
                                                        ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-700 shadow-lg shadow-indigo-500/10'
                                                        : 'bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.roles.includes(role.name)
                                                                ? 'bg-indigo-500 text-white'
                                                                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                                                }`}>
                                                                <FontAwesomeIcon icon={faShield} className="text-sm" />
                                                            </div>
                                                            <span className={`font-medium ${formData.roles.includes(role.name)
                                                                ? 'text-indigo-700 dark:text-indigo-300'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                                }`}>
                                                                {role.name}
                                                            </span>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.roles.includes(role.name)
                                                            ? 'bg-indigo-500 border-indigo-500 text-white'
                                                            : 'border-gray-300 dark:border-gray-500 group-hover:border-indigo-300'
                                                            }`}>
                                                            {formData.roles.includes(role.name) && (
                                                                <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {roles.length === 0 && (
                                            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                                <FontAwesomeIcon icon={faShield} className="text-2xl mb-2 opacity-50" />
                                                <p>No roles available. Please create roles first.</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {formData.roles.length > 0 && (
                                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-3">
                                            <FontAwesomeIcon icon={faInfoCircle} className="text-lg" />
                                            <span>
                                                Selected roles: <strong className="font-semibold">{formData.roles.join(', ')}</strong>
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <Link
                                href="/admin/users"
                                className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 text-center"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full sm:w-auto px-8 py-3 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3"
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
                    </form>
                </div>

                {/* Help Text */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faLightbulb} className="text-yellow-500" />
                        The user will be created and can be activated immediately
                    </p>
                </div>
            </div>
        </div>
    )
}