'use client'
import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import Toast from '@/components/Toast'
import AsyncMemberSelect from './AsyncMemberSelect'
import { createMinister, updateMinister, fetchMinisterById, fetchDepartmentsList, fetchDesignationsList } from '@/lib/adminApi'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faSave, faPlus } from '@fortawesome/free-solid-svg-icons'

type Props = { ministerId?: string | number | null; initial?: any; onSaved?: (m: any) => void }

export default function MinisterForm({ ministerId = null, initial = {}, onSaved }: Props) {
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [form, setForm] = useState<any>({
        member_id: initial.member_id ?? '',
        department_id: initial.department_id ?? '',
        designation_id: initial.designation_id ?? '',
        title: initial.title ?? '',
        notes: initial.notes ?? '',
        started_at: initial.started_at ?? '',
        ended_at: initial.ended_at ?? '',
        active: initial.active ?? true,
        church_id: initial.church_id ?? churchId ?? '',
    })
    const [loading, setLoading] = useState<boolean>(Boolean(ministerId) || isLoading)
    const [saving, setSaving] = useState(false)
    const [departments, setDepartments] = useState<any[]>([])
    const [designations, setDesignations] = useState<any[]>([])
    const [toast, setToast] = useState<{ show: boolean; message?: string; type?: 'success' | 'error' } | null>(null)
    const router = useRouter()

    useEffect(() => {
        let mounted = true
        async function loadMeta() {
            try {
                if (!churchId) return
                const [deps, desigs] = await Promise.allSettled([
                    fetchDepartmentsList({ church_id: churchId }),
                    fetchDesignationsList({ church_id: churchId }),
                ])
                if (!mounted) return
                setDepartments(deps.status === 'fulfilled' ? deps.value : [])
                setDesignations(desigs.status === 'fulfilled' ? desigs.value : [])
            } catch {
                // ignore
            }
        }
        loadMeta()
        return () => { mounted = false }
    }, [churchId])

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!ministerId) { setLoading(false); return }
            try {
                const res = await fetchMinisterById(ministerId as any)
                const data = res?.data ?? res
                if (!mounted) return
                setForm({
                    member_id: data.member_id,
                    department_id: data.department_id,
                    designation_id: data.designation_id,
                    title: data.title,
                    notes: data.notes,
                    started_at: data.started_at,
                    ended_at: data.ended_at,
                    active: data.active ?? true,
                    church_id: data.church_id ?? churchId,
                })
            } catch (err) {
                setToast({ show: true, message: 'Failed to load minister', type: 'error' })
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [ministerId, churchId])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value, type } = e.target as any
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = { ...form, church_id: churchId }
            let res
            if (ministerId) res = await updateMinister(ministerId as any, payload)
            else res = await createMinister(payload)
            const saved = res?.data ?? res
            setToast({ show: true, message: ministerId ? 'Minister updated successfully' : 'Minister created successfully', type: 'success' })
            onSaved?.(saved)
            if (!onSaved) {
                setTimeout(() => {
                    router.push('/admin/church/ministers')
                }, 1000)
            }
        } catch (err: any) {
            setToast({ show: true, message: err?.message ?? 'Save failed', type: 'error' })
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (isLoading || loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Member Selection */}
                <div className="bg-white dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Member Information</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Member *
                        </label>
                        <AsyncMemberSelect
                            value={form.member_id}
                            onChange={(v) => setForm(prev => ({ ...prev, member_id: v }))}
                            churchId={churchId}
                            placeholder="Search member by name or phone"
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Minister Details */}
                <div className="bg-white dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Minister Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Title
                            </label>
                            <input
                                name="title"
                                value={form.title ?? ''}
                                onChange={onChange}
                                className="w-full p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                                placeholder="e.g., Senior Pastor, Youth Minister"
                            />
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <input
                                id="active"
                                name="active"
                                type="checkbox"
                                checked={Boolean(form.active)}
                                onChange={onChange}
                                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Active Minister
                            </label>
                        </div>
                    </div>
                </div>

                {/* Assignments */}
                <div className="bg-white dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assignments</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Department
                            </label>
                            <select
                                name="department_id"
                                value={form.department_id ?? ''}
                                onChange={onChange}
                                className="w-full p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                            >
                                <option value="">— Select Department —</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Designation
                            </label>
                            <select
                                name="designation_id"
                                value={form.designation_id ?? ''}
                                onChange={onChange}
                                className="w-full p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                            >
                                <option value="">— Select Designation —</option>
                                {designations.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="bg-white dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Period</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Started Date
                            </label>
                            <input
                                name="started_at"
                                type="date"
                                value={form.started_at ?? ''}
                                onChange={onChange}
                                className="w-full p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ended Date
                            </label>
                            <input
                                name="ended_at"
                                type="date"
                                value={form.ended_at ?? ''}
                                onChange={onChange}
                                className="w-full p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-white dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Notes</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={form.notes ?? ''}
                            onChange={onChange}
                            className="w-full p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                            rows={4}
                            placeholder="Any additional notes about this minister..."
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl transition-all duration-200 mr-4"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={saving}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                        {saving ? (
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        ) : ministerId ? (
                            <FontAwesomeIcon icon={faSave} />
                        ) : (
                            <FontAwesomeIcon icon={faPlus} />
                        )}
                        {saving ? 'Saving...' : ministerId ? 'Save Changes' : 'Create Minister'}
                    </button>
                </div>
            </form>

            {toast && (
                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type ?? 'success'}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}