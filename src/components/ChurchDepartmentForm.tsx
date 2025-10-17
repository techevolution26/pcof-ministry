// src/components/ChurchDepartmentForm.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createDepartment, updateDepartment, fetchDepartments } from '@/lib/adminApi'
import Toast from '@/components/Toast'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSave,
    faSpinner,
    faBuilding,
    faFileAlt,
    faTimes
} from '@fortawesome/free-solid-svg-icons'

type Props = {
    departmentId?: string | number | null
    initial?: Partial<unknown>
    onSaved?: (dep: unknown) => void
}

export default function ChurchDepartmentForm({ departmentId = null, initial = {}, onSaved }: Props) {
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [form, setForm] = useState<unknown>({
        name: initial.name ?? '',
        description: initial.description ?? '',
        church_id: initial.church_id ?? churchId ?? ''
    })
    const [loading, setLoading] = useState<boolean>(Boolean(departmentId))
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [toast, setToast] = useState<{ show: boolean; message?: string; type?: 'success' | 'error' } | null>(null)
    const router = useRouter()

    useEffect(() => {
        if (!departmentId) { setLoading(false); return }
        let mounted = true
            ; (async () => {
                try {
                    const body = await fetchDepartments({ page: 1, per_page: 1, q: undefined, church_id: churchId })
                    // If you want to fetch single, you can hit /api/admin/departments/{id} from adminApi (not included here).
                    // For simplicity assume initial prop is provided when editing; otherwise implement fetchDepartmentById.
                } catch (err) {
                    // ignore
                } finally { if (mounted) setLoading(false) }
            })()
        return () => { mounted = false }
    }, [departmentId, churchId])

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
            if (departmentId) {
                const res = await updateDepartment(departmentId as unknown, payload)
                saved = res?.data ?? res
                setToast({ show: true, message: 'Department updated successfully!', type: 'success' })
            } else {
                const res = await createDepartment(payload)
                saved = res?.data ?? res
                setToast({ show: true, message: 'Department created successfully!', type: 'success' })
            }
            onSaved?.(saved)
            if (!onSaved) {
                setTimeout(() => router.push('/admin/church/departments'), 1500)
            }
        } catch (err: unknown) {
            if (err?.status === 422 && err.errors) setErrors(err.errors)
            else setToast({ show: true, message: err?.message ?? 'Failed to save department', type: 'error' })
        } finally { setSaving(false) }
    }

    if (isLoading || loading) return (
        <div className="text-center bg-white/50 dark:bg-gray-700/50 rounded-2xl p-8">
            <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading department...</div>
        </div>
    )

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Form Header */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
                <FontAwesomeIcon icon={faBuilding} className="text-blue-500 text-xl" />
                <div>
                    <div className="font-semibold text-blue-900 dark:text-blue-100">
                        {departmentId ? 'Edit Department' : 'New Department Details'}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        {departmentId ? 'Update department information' : 'Enter details for the new department'}
                    </div>
                </div>
            </div>

            {/* Name Field */}
            <div className="bg-white/50 dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faBuilding} className="text-blue-500" />
                    Department Name
                    <span className="text-red-500">*</span>
                </label>
                <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${errors.name ? 'border-red-300 dark:border-red-500' : 'border-gray-200/50 dark:border-gray-500/50'
                        }`}
                    placeholder="Enter department name (e.g., Worship Team, Youth Ministry, etc.)"
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
                    placeholder="Describe the purpose and responsibilities of this department..."
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Optional: Provide details about what this department does and its role in the church.
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
                            {departmentId ? 'Update Department' : 'Create Department'}
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