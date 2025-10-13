'use client'
import React, { useEffect, useState } from 'react'
import {
    createMinister,
    updateMinister,
    fetchMinisterById,
    fetchChurchesList,
    fetchDesignationsList,
    fetchDepartmentsList
} from '@/lib/adminApi'
import { useRouter } from 'next/navigation'
import MemberTypeahead from './MemberTypeahead'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUser,
    faChurch,
    faUsers,
    faIdCard,
    faCalendar,
    faCheckCircle,
    faSpinner,
    faSave,
    faPlus
} from '@fortawesome/free-solid-svg-icons'

type FormShape = {
    member_id?: string | number
    church_id?: string | number | ''
    department_id?: string | number | ''
    designation_id?: string | number | ''
    title?: string
    started_at?: string
    ended_at?: string
    active?: boolean
}

export default function MinisterForm({ ministerId }: { ministerId?: string | number }) {
    const router = useRouter()
    const [form, setForm] = useState<FormShape>({
        member_id: '',
        church_id: '',
        department_id: '',
        designation_id: '',
        title: '',
        started_at: '',
        ended_at: '',
        active: true,
    })

    const [churches, setChurches] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [designations, setDesignations] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(Boolean(ministerId))
    const [saving, setSaving] = useState<boolean>(false)
    const [listsLoading, setListsLoading] = useState<boolean>(true)

    // Loading static lists: churches + designations (once)
    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    setListsLoading(true)
                    const [chRes, desRes] = await Promise.allSettled([fetchChurchesList(), fetchDesignationsList()])
                    if (!mounted) return

                    if (chRes.status === 'fulfilled') {
                        const chList = Array.isArray(chRes.value) ? chRes.value : (chRes.value?.data ?? [])
                        setChurches(chList)
                    } else {
                        console.error('Failed to load churches', chRes.reason)
                    }

                    if (desRes.status === 'fulfilled') {
                        setDesignations(Array.isArray(desRes.value) ? desRes.value : (desRes.value?.data ?? []))
                    } else {
                        console.error('Failed to load designations', desRes.reason)
                    }
                } catch (err) {
                    console.error('Initial lists load failed', err)
                } finally {
                    if (mounted) setListsLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [])

    // Loading departments for selected church (runs when church_id changes)
    useEffect(() => {
        let mounted = true
        async function loadDepartments(churchId?: string | number | '') {
            if (!churchId) { if (mounted) setDepartments([]); return }
            try {
                const res = await fetchDepartmentsList({ church_id: churchId })
                if (!mounted) return
                const list = Array.isArray(res) ? res : (res?.data ?? [])
                setDepartments(list)
            } catch (err) {
                console.error('Failed to load departments', err)
                if (mounted) setDepartments([])
            }
        }
        loadDepartments(form.church_id)
        return () => { mounted = false }
    }, [form.church_id])

    // Loading minister when editing; ensure departments for minister's church are loaded
    useEffect(() => {
        if (!ministerId) {
            setLoading(false)
            return
        }
        let mounted = true
            ; (async () => {
                try {
                    setLoading(true)
                    const res = await fetchMinisterById(ministerId!)
                    if (!mounted) return
                    const d = res?.data ?? res

                    const initial = {
                        member_id: d.member_id ?? (d.member?.id ?? ''),
                        church_id: d.church_id ?? '',
                        department_id: d.department_id ?? '',
                        designation_id: d.designation_id ?? '',
                        title: d.title ?? '',
                        started_at: d.started_at ? d.started_at.slice(0, 16) : '',
                        ended_at: d.ended_at ? d.ended_at.slice(0, 16) : '',
                        active: !!d.active,
                    }
                    setForm(initial)

                    // loading departments for this minister's church
                    if (initial.church_id) {
                        try {
                            const depRes = await fetchDepartmentsList({ church_id: initial.church_id })
                            if (!mounted) return
                            setDepartments(Array.isArray(depRes) ? depRes : (depRes?.data ?? []))
                        } catch (err) {
                            console.error('Failed to load departments for minister', err)
                        }
                    }
                } catch (err) {
                    console.error('Failed to load minister', err)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [ministerId])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value, type } = e.target as HTMLInputElement
        if (type === 'checkbox') {
            setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
        } else {
            setForm(prev => ({ ...prev, [name]: value }))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                ...form,
                started_at: form.started_at ? new Date(form.started_at).toISOString() : null,
                ended_at: form.ended_at ? new Date(form.ended_at).toISOString() : null,
            }
            if (ministerId) {
                await updateMinister(ministerId, payload)
            } else {
                await createMinister(payload)
            }
            router.push('/admin/ministers')
        } catch (err: any) {
            const msg = err?.message ?? 'Save failed'
            alert(msg)
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-8">
                <div className="text-center py-8">
                    <FontAwesomeIcon
                        icon={faSpinner}
                        className="mx-auto mb-4 text-2xl text-blue-600 animate-spin"
                    />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Loading minister details...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Member Selection */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faUser} className="text-blue-500 text-lg" />
                        Member Information
                    </h2>
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select Member *
                        </label>
                        <div className="max-w-2xl">
                            <MemberTypeahead
                                value={form.member_id}
                                onSelect={(m: any | null) => setForm(prev => ({ ...prev, member_id: m ? m.id : '' }))}
                                placeholder="Type a member name or email…"
                                required
                            />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Search for a member by name or email address to assign them as a minister.
                        </p>
                    </div>
                </section>

                {/* Church & Department Assignment */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faChurch} className="text-purple-500 text-lg" />
                        Church & Department
                    </h2>

                    {listsLoading ? (
                        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 p-4">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            Loading churches and departments...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Church *
                                </label>
                                <div className="relative">
                                    <select
                                        name="church_id"
                                        value={String(form.church_id ?? '')}
                                        onChange={onChange}
                                        required
                                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white appearance-none"
                                    >
                                        <option value="">— Select a church —</option>
                                        {churches.map((c: any) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <FontAwesomeIcon
                                        icon={faChurch}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Department
                                </label>
                                <div className="relative">
                                    <select
                                        name="department_id"
                                        value={String(form.department_id ?? '')}
                                        onChange={onChange}
                                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white appearance-none"
                                    >
                                        <option value="">— Select a department —</option>
                                        {departments.map((d: any) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    <FontAwesomeIcon
                                        icon={faUsers}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                    />
                                </div>
                                {form.church_id && departments.length === 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        No departments available for this church.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* Role & Designation */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faIdCard} className="text-orange-500 text-lg" />
                        Role & Designation
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Designation
                            </label>
                            <div className="relative">
                                <select
                                    name="designation_id"
                                    value={String(form.designation_id ?? '')}
                                    onChange={onChange}
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white appearance-none"
                                >
                                    <option value="">— Select a designation —</option>
                                    {designations.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <FontAwesomeIcon
                                    icon={faIdCard}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Custom Title (Optional)
                            </label>
                            <input
                                name="title"
                                value={String(form.title ?? '')}
                                onChange={onChange}
                                placeholder="e.g., Senior Pastor, Youth Leader"
                                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Override the default designation with a custom title
                            </p>
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faCalendar} className="text-green-500 text-lg" />
                        Service Timeline
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Start Date & Time
                            </label>
                            <input
                                name="started_at"
                                type="datetime-local"
                                value={String(form.started_at ?? '')}
                                onChange={onChange}
                                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                End Date & Time
                            </label>
                            <input
                                name="ended_at"
                                type="datetime-local"
                                value={String(form.ended_at ?? '')}
                                onChange={onChange}
                                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Leave empty if currently active
                            </p>
                        </div>
                    </div>
                </section>

                {/* Status */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 text-lg" />
                        Status
                    </h2>

                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                        <input
                            id="active"
                            name="active"
                            type="checkbox"
                            checked={!!form.active}
                            onChange={onChange}
                            className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="active" className="text-lg font-medium text-gray-900 dark:text-white">
                            Active Minister
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
                            {form.active ? 'Minister is currently active' : 'Minister is inactive'}
                        </p>
                    </div>
                </section>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 text-center"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={saving || listsLoading}
                        className="w-full sm:w-auto px-8 py-3 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3"
                    >
                        {saving ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={ministerId ? faSave : faPlus} />
                                {ministerId ? 'Save Changes' : 'Create Minister'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}