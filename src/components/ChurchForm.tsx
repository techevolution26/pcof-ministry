'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createChurch, updateChurch, fetchChurchById } from '@/lib/adminApi'
import Toast from './Toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faChurch,
    faSave,
    faSpinner,
    faArrowLeft,
    faMapMarkerAlt,
    faUserTie,
    faFileAlt
} from '@fortawesome/free-solid-svg-icons'

type Props = {
    churchId?: string | number
}

export default function ChurchForm({ churchId }: Props) {
    const [form, setForm] = useState<any>({
        name: '',
        branch: '',
        address: '',
        pastor: '',
        description: '',
    })
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(Boolean(churchId))
    const [errors, setErrors] = useState<Record<string, string[]>>({})

    const [toast, setToast] = useState<{ show: boolean; message?: string; type?: 'success' | 'error' | 'info' }>({ show: false })

    const router = useRouter()

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!churchId) return setInitialLoading(false)
            try {
                const body = await fetchChurchById(churchId)
                const data = body?.data ?? body
                if (!mounted) return
                setForm({
                    name: data.name ?? '',
                    branch: data.branch ?? '',
                    address: data.address ?? '',
                    pastor: data.pastor ?? '',
                    description: data.description ?? '',
                })
            } catch (err) {
                console.error('Failed to load church', err)
            } finally {
                if (mounted) setInitialLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [churchId])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: [] }))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErrors({})
        setLoading(true)
        try {
            const payload = { ...form }
            let res
            if (churchId) {
                res = await updateChurch(churchId, payload)
            } else {
                res = await createChurch(payload)
            }

            setToast({ show: true, message: churchId ? 'Church updated successfully!' : 'Church created successfully!', type: 'success' })
            setTimeout(() => {
                setToast({ show: false })
                router.push('/admin/churches')
            }, 1500)
        } catch (err: any) {
            if (err?.status === 422 && err.errors) {
                setErrors(err.errors)
                setToast({ show: true, message: 'Please correct the highlighted fields', type: 'error' })
            } else {
                const msg = err?.message ?? 'Save failed'
                setToast({ show: true, message: msg, type: 'error' })
                console.error(err)
            }
        } finally {
            setLoading(false)
        }
    }

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-8">
                        <div className="flex items-center justify-center gap-3 py-12">
                            <FontAwesomeIcon icon={faSpinner} className="text-blue-500 text-xl animate-spin" />
                            <div className="text-gray-600 dark:text-gray-400 font-medium">Loading church details...</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                {churchId ? 'Edit Church' : 'Create New Church'}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300 text-lg">
                                {churchId ? 'Update church information and details' : 'Add a new church to your organization'}
                            </p>
                        </div>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-8">
                    {/* Church Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <FontAwesomeIcon icon={faChurch} className="text-blue-500 text-sm" />
                            Church Name *
                        </label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            required
                            className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.name ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                                }`}
                            placeholder="Enter church name"
                        />
                        {errors.name && (
                            <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 mt-1">
                                <span>⚠</span>
                                {errors.name.join(' ')}
                            </div>
                        )}
                    </div>

                    {/* Branch and Pastor */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Branch Name
                            </label>
                            <input
                                name="branch"
                                value={form.branch}
                                onChange={onChange}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Main branch, Downtown, etc."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                <FontAwesomeIcon icon={faUserTie} className="text-green-500 text-sm" />
                                Lead Pastor
                            </label>
                            <input
                                name="pastor"
                                value={form.pastor}
                                onChange={onChange}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Pastor's full name"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 text-sm" />
                            Church Address
                        </label>
                        <input
                            name="address"
                            value={form.address}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Street address, city, state"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFileAlt} className="text-purple-500 text-sm" />
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                            rows={4}
                            placeholder="Tell us about this church, its mission, and community..."
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:opacity-50 transition-all duration-200 font-semibold flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} className="text-sm animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faSave} className="text-sm" />
                                    {churchId ? 'Update Church' : 'Create Church'}
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false })}
                />
            </div>
        </div>
    )
}