'use client'
import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import Toast from '@/components/Toast'
import AsyncMemberSelect from './AsyncMemberSelect'
import { createMinister, updateMinister, fetchMinisterById, fetchDepartmentsList, fetchDesignationsList } from '@/lib/adminApi'
import { useRouter } from 'next/navigation'

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
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
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
            setToast({ show: true, message: ministerId ? 'Minister updated' : 'Minister created', type: 'success' })
            onSaved?.(saved)
            if (!onSaved) router.push('/admin/church/ministers')
        } catch (err: any) {
            setToast({ show: true, message: err?.message ?? 'Save failed', type: 'error' })
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (isLoading || loading) return <div className="p-4 text-gray-500">Loading…</div>

    return (
        <div className="bg-white rounded shadow p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs text-gray-600">Member</label>
                    <AsyncMemberSelect
                        value={form.member_id}
                        onChange={(v) => setForm(prev => ({ ...prev, member_id: v }))}
                        churchId={churchId}
                        placeholder="Search member by name or phone"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs text-gray-600">Department</label>
                        <select name="department_id" value={form.department_id ?? ''} onChange={onChange} className="w-full p-2 border rounded">
                            <option value="">— none —</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600">Designation</label>
                        <select name="designation_id" value={form.designation_id ?? ''} onChange={onChange} className="w-full p-2 border rounded">
                            <option value="">— none —</option>
                            {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600">Title</label>
                        <input name="title" value={form.title ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-600">Notes</label>
                    <textarea name="notes" value={form.notes ?? ''} onChange={onChange} className="w-full p-2 border rounded" rows={3} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs text-gray-600">Started at</label>
                        <input name="started_at" type="date" value={form.started_at ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600">Ended at</label>
                        <input name="ended_at" type="date" value={form.ended_at ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                        <input id="active" name="active" type="checkbox" checked={Boolean(form.active)} onChange={onChange} />
                        <label htmlFor="active" className="text-xs text-gray-600">Active</label>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">{saving ? 'Saving…' : ministerId ? 'Save' : 'Create'}</button>
                </div>
            </form>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type ?? 'success'} onClose={() => setToast(null)} />}
        </div>
    )
}
