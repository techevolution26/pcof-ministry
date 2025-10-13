'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchRoles } from '@/lib/adminApi'
import { useAdminAuth } from '@/hooks/useAdminAuth'

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
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        roles: []
    })

    // Load available roles
    React.useEffect(() => {
        fetchRoles().then(setRoles).catch(console.error)
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-purple-900 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Create New User
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Add a new user to the system and assign roles
                            </p>
                        </div>
                        <Link
                            href="/admin/users"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                        >
                            <i className="fas fa-arrow-left text-sm"></i>
                            Back to Users
                        </Link>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                            <i className="fas fa-exclamation-circle"></i>
                            <span className="font-medium">Error:</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Basic Information Section */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <i className="fas fa-user text-blue-500"></i>
                                Basic Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name Field */}
                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200"
                                        placeholder="Enter full name"
                                    />
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200"
                                        placeholder="Enter email address"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password Section */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <i className="fas fa-lock text-green-500"></i>
                                Security Settings
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200"
                                        placeholder="Enter password"
                                        minLength={6}
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Minimum 6 characters
                                    </p>
                                </div>

                                {/* Confirm Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Confirm Password *
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white backdrop-blur-sm transition-all duration-200"
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Roles Section */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <i className="fas fa-user-shield text-purple-500"></i>
                                Role Assignment
                            </h2>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Select User Roles
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {roles.map((role) => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => handleRoleToggle(role.name)}
                                            className={`px-4 py-2 rounded-lg border transition-all duration-200 backdrop-blur-sm ${formData.roles.includes(role.name)
                                                ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/25'
                                                : 'bg-white/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <i className={`fas ${formData.roles.includes(role.name) ? 'fa-check-circle' : 'fa-circle'
                                                    } text-sm`}></i>
                                                <span className="font-medium">{role.name}</span>
                                            </div>
                                        </button>
                                    ))}

                                    {roles.length === 0 && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                            Loading roles...
                                        </div>
                                    )}
                                </div>

                                {formData.roles.length > 0 && (
                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                            <i className="fas fa-info-circle"></i>
                                            <span>
                                                Selected roles: <strong>{formData.roles.join(', ')}</strong>
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                            <Link
                                href="/admin/users"
                                className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-all duration-200"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:from-blue-600 hover:to-purple-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Creating User...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <i className="fas fa-user-plus"></i>
                                        Create User
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        <i className="fas fa-lightbulb text-yellow-500 mr-1"></i>
                        The user will be created and can be activated immediately
                    </p>I
                </div>
            </div>
        </div>
    )
}