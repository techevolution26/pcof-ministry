'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '@/components/Toast'
import { createMember, updateMember, fetchMemberById, fetchDepartmentsList, fetchDesignationsList, fetchMinistersList } from '@/lib/adminApi'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUser,
    faEnvelope,
    faPhone,
    faIdCard,
    faVenusMars,
    faCalendar,
    faUsers,
    faUserTie,
    faSave,
    faPlus,
    faSpinner,
    faTimes
} from '@fortawesome/free-solid-svg-icons'

type Props = {
    memberId?: string | number | null
    initial?: Partial<Record<string, unknown>>
    onSaved?: (member: unknown) => void
    onCancel?: () => void
}

export default function ChurchMemberForm({ memberId = null, initial = {}, onSaved, onCancel }: Props) {
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [form, setForm] = useState<unknown>({
        church_id: initial.church_id ?? churchId ?? '',
        first_name: initial.first_name ?? '',
        last_name: initial.last_name ?? '',
        email: initial.email ?? '',
        phone: initial.phone ?? '',
        member_number: initial.member_number ?? '',
        gender: initial.gender ?? '',
        date_of_birth: initial.date_of_birth ?? '',
        membership_date: initial.membership_date ?? '',
        designation_id: initial.designation_id ?? '',
        assembly_id: initial.assembly_id ?? '',
        department_id: initial.department_id ?? '',
        minister_id: initial.minister_id ?? '',
    })
    const [loading, setLoading] = useState<boolean>(Boolean(memberId) || isLoading)
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [toast, setToast] = useState<{ show: boolean; message?: string; type?: 'success' | 'error' } | null>(null)

    const [departments, setDepartments] = useState<unknown[]>([])
    const [designations, setDesignations] = useState<unknown[]>([])
    const [ministers, setMinisters] = useState<unknown[]>([])
    const [loadingMeta, setLoadingMeta] = useState(true)

    useEffect(() => {
        let mounted = true
        async function loadMeta() {
            setLoadingMeta(true)
            try {
                if (!churchId) return
                const [deps, desigs, mins] = await Promise.allSettled([
                    fetchDepartmentsList({ church_id: churchId }),
                    fetchDesignationsList({ church_id: churchId }),
                    fetchMinistersList({ church_id: churchId }),
                ])
                if (!mounted) return
                setDepartments(deps.status === 'fulfilled' ? deps.value : [])
                setDesignations(desigs.status === 'fulfilled' ? desigs.value : [])
                setMinisters(mins.status === 'fulfilled' ? mins.value : [])
            } catch (err) {
                // ignore; we'll show empty lists
            } finally {
                if (mounted) setLoadingMeta(false)
            }
        }
        if (!isLoading) loadMeta()
        return () => { mounted = false }
    }, [churchId, isLoading])

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!memberId) { setLoading(false); return }
            try {
                const body = await fetchMemberById(memberId as unknown)
                const data = body?.data ?? body
                if (!mounted) return
                setForm(prev => ({
                    ...prev,
                    church_id: data.church_id ?? prev.church_id,
                    first_name: data.first_name ?? '',
                    last_name: data.last_name ?? '',
                    email: data.email ?? '',
                    phone: data.phone ?? '',
                    member_number: data.member_number ?? '',
                    gender: data.gender ?? '',
                    date_of_birth: data.date_of_birth ?? '',
                    membership_date: data.membership_date ?? '',
                    designation_id: data.designation_id ?? '',
                    department_id: data.department_id ?? '',
                    assembly_id: data.assembly_id ?? '',
                    minister_id: data.minister_id ?? '',
                }))
            } catch (err) {
                console.error('Failed to load member', err)
                setToast({ show: true, message: 'Failed to load member', type: 'error' })
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [memberId])

    // keep church_id locked to current user's church (church_admin)
    useEffect(() => {
        if (churchId) setForm(prev => ({ ...prev, church_id: churchId }))
    }, [churchId])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setErrors({})
        try {
            // ensure church_id always set to user's church
            const payload = { ...form, church_id: churchId }
            let res
            if (memberId) {
                res = await updateMember(memberId as unknown, payload)
            } else {
                res = await createMember(payload)
            }
            const saved = (res?.data ?? res)
            setToast({ show: true, message: memberId ? 'Member updated successfully' : 'Member created successfully', type: 'success' })
            onSaved?.(saved)
            if (!onSaved) router.push('/admin/church/members')
        } catch (err: unknown) {
            if (err?.status === 422 && err.errors) setErrors(err.errors)
            else {
                const msg = err?.message ?? 'Save failed'
                setToast({ show: true, message: msg, type: 'error' })
                console.error(err)
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading || loadingMeta) {
        return (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-8">
                <div className="text-center py-8">
                    <FontAwesomeIcon
                        icon={faSpinner}
                        className="mx-auto mb-4 text-2xl text-blue-600 animate-spin"
                    />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {memberId ? 'Loading member details...' : 'Loading form...'}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Basic Information Section */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faUser} className="text-blue-500 text-lg" />
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                First Name *
                            </label>
                            <div className="relative">
                                <input
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={onChange}
                                    required
                                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border ${errors.first_name ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11`}
                                    placeholder="Enter first name"
                                />
                                <FontAwesomeIcon
                                    icon={faUser}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                            </div>
                            {errors.first_name && (
                                <div className="text-red-600 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    {errors.first_name.join(' ')}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Last Name
                            </label>
                            <div className="relative">
                                <input
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={onChange}
                                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border ${errors.last_name ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11`}
                                    placeholder="Enter last name"
                                />
                                <FontAwesomeIcon
                                    icon={faUser}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                            </div>
                            {errors.last_name && (
                                <div className="text-red-600 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    {errors.last_name.join(' ')}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Contact Information Section */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faPhone} className="text-green-500 text-lg" />
                        Contact Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Phone Number
                            </label>
                            <div className="relative">
                                <input
                                    name="phone"
                                    value={form.phone}
                                    onChange={onChange}
                                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border ${errors.phone ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11`}
                                    placeholder="Enter phone number"
                                />
                                <FontAwesomeIcon
                                    icon={faPhone}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                            </div>
                            {errors.phone && (
                                <div className="text-red-600 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    {errors.phone.join(' ')}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    name="email"
                                    value={form.email}
                                    onChange={onChange}
                                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border ${errors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11`}
                                    placeholder="Enter email address"
                                />
                                <FontAwesomeIcon
                                    icon={faEnvelope}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                            </div>
                            {errors.email && (
                                <div className="text-red-600 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    {errors.email.join(' ')}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Personal Details Section */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faIdCard} className="text-purple-500 text-lg" />
                        Personal Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Gender
                            </label>
                            <div className="relative">
                                <select
                                    name="gender"
                                    value={form.gender}
                                    onChange={onChange}
                                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border ${errors.gender ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white appearance-none pr-11`}
                                >
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                                <FontAwesomeIcon
                                    icon={faVenusMars}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                            </div>
                            {errors.gender && (
                                <div className="text-red-600 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    {errors.gender.join(' ')}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Date of Birth
                            </label>
                            <div className="relative">
                                <input
                                    name="date_of_birth"
                                    type="date"
                                    value={form.date_of_birth ?? ''}
                                    onChange={onChange}
                                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border ${errors.date_of_birth ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white pl-11`}
                                />
                                <FontAwesomeIcon
                                    icon={faCalendar}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                            </div>
                            {errors.date_of_birth && (
                                <div className="text-red-600 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    {errors.date_of_birth.join(' ')}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Member Number
                            </label>
                            <div className="relative">
                                <input
                                    name="member_number"
                                    value={form.member_number}
                                    onChange={onChange}
                                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border ${errors.member_number ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11`}
                                    placeholder="Optional member number"
                                />
                                <FontAwesomeIcon
                                    icon={faIdCard}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                            </div>
                            {errors.member_number && (
                                <div className="text-red-600 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    {errors.member_number.join(' ')}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Church Assignment Section */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faUsers} className="text-orange-500 text-lg" />
                        Church Assignment
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Department
                            </label>
                            <div className="relative">
                                <select
                                    name="department_id"
                                    value={form.department_id ?? ''}
                                    onChange={onChange}
                                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border ${errors.department_id ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white appearance-none pr-11`}
                                >
                                    <option value="">Select department</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <FontAwesomeIcon
                                    icon={faUsers}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                            </div>
                            {errors.department_id && (
                                <div className="text-red-600 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    {errors.department_id.join(' ')}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Designation
                            </label>
                            <div className="relative">
                                <select
                                    name="designation_id"
                                    value={form.designation_id ?? ''}
                                    onChange={onChange}
                                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border ${errors.designation_id ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white appearance-none pr-11`}
                                >
                                    <option value="">Select designation</option>
                                    {designations.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <FontAwesomeIcon
                                    icon={faUserTie}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                            </div>
                            {errors.designation_id && (
                                <div className="text-red-600 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    {errors.designation_id.join(' ')}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Assigned Minister
                            </label>
                            <div className="relative">
                                <select
                                    name="minister_id"
                                    value={form.minister_id ?? ''}
                                    onChange={onChange}
                                    className={`w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border ${errors.minister_id ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                                        } rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white appearance-none pr-11`}
                                >
                                    <option value="">Select minister</option>
                                    {ministers.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {(m.first_name ? `${m.first_name} ${m.last_name ?? ''}` : m.name) ?? m.id}
                                        </option>
                                    ))}
                                </select>
                                <FontAwesomeIcon
                                    icon={faUserTie}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                            </div>
                            {errors.minister_id && (
                                <div className="text-red-600 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    {errors.minister_id.join(' ')}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {onCancel ? (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 text-center"
                        >
                            Cancel
                        </button>
                    ) : (
                        <div></div> // Empty div to maintain flex layout
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto px-8 py-3 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3"
                    >
                        {saving ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={memberId ? faSave : faPlus} />
                                {memberId ? 'Update Member' : 'Create Member'}
                            </>
                        )}
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