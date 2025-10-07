// src/components/ChurchMemberForm.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '@/components/Toast'
import { createMember, updateMember, fetchMemberById, fetchDepartmentsList, fetchDesignationsList, fetchMinistersList } from '@/lib/adminApi'
import { useAdminAuth } from '@/hooks/useAdminAuth'

type Props = {
    memberId?: string | number | null
    initial?: Partial<Record<string, any>>
    onSaved?: (member: any) => void
    onCancel?: () => void
}

export default function ChurchMemberForm({ memberId = null, initial = {}, onSaved, onCancel }: Props) {
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [form, setForm] = useState<any>({
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

    const [departments, setDepartments] = useState<any[]>([])
    const [designations, setDesignations] = useState<any[]>([])
    const [ministers, setMinisters] = useState<any[]>([])
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
                const body = await fetchMemberById(memberId as any)
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
                res = await updateMember(memberId as any, payload)
            } else {
                res = await createMember(payload)
            }
            const saved = (res?.data ?? res)
            setToast({ show: true, message: memberId ? 'Member updated' : 'Member created', type: 'success' })
            onSaved?.(saved)
            if (!onSaved) router.push('/admin/church/members')
        } catch (err: any) {
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

    if (loading || loadingMeta) return <div className="p-4 text-gray-500">Loading…</div>

    return (
        <div className="bg-white rounded shadow p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs text-gray-600">First name</label>
                    <input name="first_name" value={form.first_name} onChange={onChange} required className="w-full p-2 border rounded" />
                    {errors.first_name && <div className="text-red-600 text-sm">{errors.first_name.join(' ')}</div>}
                </div>

                <div>
                    <label className="block text-xs text-gray-600">Last name</label>
                    <input name="last_name" value={form.last_name} onChange={onChange} className="w-full p-2 border rounded" />
                    {errors.last_name && <div className="text-red-600 text-sm">{errors.last_name.join(' ')}</div>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-600">Phone</label>
                        <input name="phone" value={form.phone} onChange={onChange} className="w-full p-2 border rounded" />
                        {errors.phone && <div className="text-red-600 text-sm">{errors.phone.join(' ')}</div>}
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600">Email</label>
                        <input name="email" value={form.email} onChange={onChange} className="w-full p-2 border rounded" />
                        {errors.email && <div className="text-red-600 text-sm">{errors.email.join(' ')}</div>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs text-gray-600">Gender</label>
                        <select name="gender" value={form.gender} onChange={onChange} className="w-full p-2 border rounded">
                            <option value="">—</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                        {errors.gender && <div className="text-red-600 text-sm">{errors.gender.join(' ')}</div>}
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600">DOB</label>
                        <input name="date_of_birth" type="date" value={form.date_of_birth ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                        {errors.date_of_birth && <div className="text-red-600 text-sm">{errors.date_of_birth.join(' ')}</div>}
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600">Member # (optional)</label>
                        <input name="member_number" value={form.member_number} onChange={onChange} className="w-full p-2 border rounded" />
                        {errors.member_number && <div className="text-red-600 text-sm">{errors.member_number.join(' ')}</div>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs text-gray-600">Department</label>
                        <select name="department_id" value={form.department_id ?? ''} onChange={onChange} className="w-full p-2 border rounded">
                            <option value="">— none —</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        {errors.department_id && <div className="text-red-600 text-sm">{errors.department_id.join(' ')}</div>}
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600">Designation</label>
                        <select name="designation_id" value={form.designation_id ?? ''} onChange={onChange} className="w-full p-2 border rounded">
                            <option value="">— none —</option>
                            {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        {errors.designation_id && <div className="text-red-600 text-sm">{errors.designation_id.join(' ')}</div>}
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600">Minister (assign)</label>
                        <select name="minister_id" value={form.minister_id ?? ''} onChange={onChange} className="w-full p-2 border rounded">
                            <option value="">— none —</option>
                            {ministers.map(m => <option key={m.id} value={m.id}>{(m.first_name ? `${m.first_name} ${m.last_name ?? ''}` : m.name) ?? m.id}</option>)}
                        </select>
                        {errors.minister_id && <div className="text-red-600 text-sm">{errors.minister_id.join(' ')}</div>}
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="px-3 py-2 border rounded">Cancel</button>
                    )}
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">
                        {saving ? 'Saving…' : memberId ? 'Save' : 'Create member'}
                    </button>
                </div>
            </form>

            {toast && (
                <Toast show={toast.show} message={toast.message} type={toast.type ?? 'success'} onClose={() => setToast(null)} />
            )}
        </div>
    )
}
