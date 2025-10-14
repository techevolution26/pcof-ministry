// src/components/ChurchDesignationForm.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createDesignation, updateDesignation } from '@/lib/adminApi'
import Toast from '@/components/Toast'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSave,
    faSpinner,
    faUserTie,
    faFileAlt,
    faTimes,
    faChurch
} from '@fortawesome/free-solid-svg-icons'

type Props = { designationId?: string | number | null; initial?: any; onSaved?: (d: any) => void }

export default function ChurchDesignationForm({ designationId = null, initial = {}, onSaved }: Props) {
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [form, setForm] = useState<any>({
        name: initial.name ?? '',
        description: initial.description ?? '',
        church_id: initial.church_id ?? churchId ?? ''
    })
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [toast, setToast] = useState<{ show: boolean; message?: string; type?: 'success' | 'error' } | null>(null)
    const router = useRouter()

    useEffect(() => {
        // ensure church_id locked to user
        setForm(prev => ({ ...prev, church_id: churchId ?? prev.church_id }))
    }, [churchId])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: [] }))
        }
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true); setErrors({})
        try {
            const payload = { ...form, church_id: churchId }
            let saved
            if (designationId) {
                const res = await updateDesignation(designationId as any, payload)
                saved = res?.data ?? res
                setToast({ show: true, message: 'Designation updated successfully!', type: 'success' })
            } else {
                const res = await createDesignation(payload)
                saved = res?.data ?? res
                setToast({ show: true, message: 'Designation created successfully!', type: 'success' })
            }
            onSaved?.(saved)
            if (!onSaved) {
                setTimeout(() => router.push('/admin/church/designations'), 1500)
            }
        } catch (err: any) {
            if (err?.status === 422 && err.errors) setErrors(err.errors)
            else setToast({ show: true, message: err?.message ?? 'Failed to save designation', type: 'error' })
        } finally { setSaving(false) }
    }

    if (isLoading) return (
        <div className="text-center bg-white/50 dark:bg-gray-700/50 rounded-2xl p-8">
            <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading...</div>
        </div>
    )

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Form Header */}
            <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200/50 dark:border-purple-700/50">
                <FontAwesomeIcon icon={faUserTie} className="text-purple-500 text-xl" />
                <div>
                    <div className="font-semibold text-purple-900 dark:text-purple-100">
                        {designationId ? 'Edit Church Designation' : 'New Church Designation'}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                        {designationId ? 'Update church-specific designation' : 'Create a new designation for your church'}
                    </div>
                </div>
            </div>

            {/* Church Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faChurch} className="text-blue-500" />
                    <div>
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Church Assignment</div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                            This designation will be associated with your church
                        </div>
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
                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${errors.name ? 'border-red-300 dark:border-red-500' : 'border-gray-200/50 dark:border-gray-500/50'
                        }`}
                    placeholder="Enter designation name (e.g., Youth Pastor, Worship Leader, etc.)"
                />
                {errors.name && (
                    <div className="mt-2 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                        {errors.name.join(' ')}
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
                    placeholder="Describe the role, responsibilities, and purpose of this designation within your church..."
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Optional: Provide details about what this designation entails and its responsibilities in your church.
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

            {toast && (
                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </form>
    )
}