// src/components/DesignationForm.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { createDesignation, updateDesignation } from '@/lib/adminApi'
import Toast from '@/components/Toast'
import { useRouter } from 'next/navigation'

type Props = { designationId?: string | number | null; initial?: any; onSaved?: (d: any) => void }

export default function ChurchDesignationForm({ designationId = null, initial = {}, onSaved }: Props) {
    const { user, isLoading } = useAdminAuth()
    const churchId = user?.church_id
    const [form, setForm] = useState<any>({ name: initial.name ?? '', description: initial.description ?? '', church_id: initial.church_id ?? churchId ?? '' })
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
                setToast({ show: true, message: 'Designation updated', type: 'success' })
            } else {
                const res = await createDesignation(payload)
                saved = res?.data ?? res
                setToast({ show: true, message: 'Designation created', type: 'success' })
            }
            onSaved?.(saved)
            if (!onSaved) router.push('/admin/church/designations')
        } catch (err: any) {
            if (err?.status === 422 && err.errors) setErrors(err.errors)
            else setToast({ show: true, message: err?.message ?? 'Save failed', type: 'error' })
        } finally { setSaving(false) }
    }

    if (isLoading) return <div className="p-4 text-gray-500">Loading…</div>

    return (
        <div className="bg-white rounded shadow p-4">
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-xs text-gray-600">Name</label>
                    <input name="name" value={form.name} onChange={onChange} required className="w-full p-2 border rounded" />
                    {errors.name && <div className="text-red-600 text-sm">{errors.name.join(' ')}</div>}
                </div>

                <div>
                    <label className="block text-xs text-gray-600">Description</label>
                    <textarea name="description" value={form.description} onChange={onChange} className="w-full p-2 border rounded" />
                </div>

                <div className="flex justify-end">
                    <button disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">{saving ? 'Saving…' : designationId ? 'Save' : 'Create'}</button>
                </div>
            </form>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type ?? 'success'} onClose={() => setToast(null)} />}
        </div>
    )
}
