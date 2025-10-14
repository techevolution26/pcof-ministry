'use client'
import React, { useEffect, useState } from 'react'
import { createDesignation, updateDesignation, fetchDesignationById } from '@/lib/adminApi'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSave,
    faSpinner,
    faUserTie,
    faFileAlt,
    faTimes
} from '@fortawesome/free-solid-svg-icons'

export default function DesignationForm({ designationId }: { designationId?: string | number }) {
    const router = useRouter()
    const [form, setForm] = useState({ name: '', description: '' })
    const [loading, setLoading] = useState(Boolean(designationId))
    const [saving, setSaving] = useState(false)
    const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({})

    useEffect(() => {
        if (!designationId) { setLoading(false); return }
        let mounted = true
            ; (async () => {
                try {
                    const res = await fetchDesignationById(designationId!)
                    if (!mounted) return
                    const d = res?.data ?? res
                    setForm({ name: d.name ?? '', description: d.description ?? '' })
                } catch (err) { console.error(err) }
                finally { if (mounted) setLoading(false) }
            })()
        return () => { mounted = false }
    }, [designationId])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.target as HTMLInputElement
        setForm(prev => ({ ...prev, [name]: value }))
        // Clear errors when user starts typing
        if (serverErrors[name]) {
            setServerErrors(prev => ({ ...prev, [name]: [] }))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setServerErrors({})
        try {
            if (designationId) {
                await updateDesignation(designationId, form)
            } else {
                await createDesignation(form)
            }
            router.push('/admin/designations')
        } catch (err: any) {
            if (err?.status === 422 && err.errors) {
                // show field errors
                setServerErrors(err.errors)
            } else {
                const msg = err?.message ?? 'Failed to save designation'
                alert(msg)
                console.error(err)
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="text-center bg-white/50 dark:bg-gray-700/50 rounded-2xl p-8">
            <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading designation...</div>
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Header */}
            <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200/50 dark:border-purple-700/50">
                <FontAwesomeIcon icon={faUserTie} className="text-purple-500 text-xl" />
                <div>
                    <div className="font-semibold text-purple-900 dark:text-purple-100">
                        {designationId ? 'Edit Designation' : 'New Designation Details'}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                        {designationId ? 'Update designation information' : 'Enter details for the new designation'}
                    </div>
                </div>
            </div>

            {/* Name Field */}
            <div className="bg-white/50 dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faUserTie} className="text-purple-500" />
                    Designation Name
                    <span className="text-red-500">*</span>
                </label>
                <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${serverErrors.name ? 'border-red-300 dark:border-red-500' : 'border-gray-200/50 dark:border-gray-500/50'
                        }`}
                    placeholder="Enter designation name (e.g., Pastor, Elder, Deacon, etc.)"
                />
                {serverErrors.name && (
                    <div className="mt-2 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                        {serverErrors.name.join(' ')}
                    </div>
                )}
            </div>

            {/* Description Field */}
            <div className="bg-white/50 dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faFileAlt} className="text-gray-500" />
                    Description
                </label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={onChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    placeholder="Describe the role, responsibilities, and purpose of this designation..."
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Optional: Provide details about what this designation entails and its responsibilities.
                </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                    Cancel
                </button>
                <button
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg font-medium"
                >
                    {saving ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faSave} />
                            {designationId ? 'Update Designation' : 'Create Designation'}
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}