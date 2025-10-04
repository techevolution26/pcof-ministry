'use client'
import React, { useEffect, useState } from 'react'
import { createDesignation, updateDesignation, fetchDesignationById } from '@/lib/adminApi'
import { useRouter } from 'next/navigation'

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
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setServerErrors({})
        try {
            if (designationId) await updateDesignation(designationId, form)
            else await createDesignation(form)
            router.push('/admin/designations')
        } catch (err: any) {
            if (err?.status === 422 && err.errors) {
                // show field errors
                setServerErrors(err.errors)
            } else {
                const msg = err?.message ?? 'Save failed'
                alert(msg)
                console.error(err)
            }
        } finally {
            setSaving(false)
        }
    }


    if (loading) return <div>Loading…</div>

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
            <div>
                <label className="block text-sm">Name</label>
                <input name="name" value={form.name} onChange={onChange} required className="w-full p-2 border rounded" />
                {serverErrors.name && <div className="text-red-600 text-sm">{serverErrors.name.join(' ')}</div>}</div>
            <div>
                <label className="block text-sm">Description</label>
                <textarea name="description" value={form.description} onChange={onChange} rows={4} className="w-full p-2 border rounded" />
            </div>
            <div className="flex justify-end">
                <button className="px-4 py-2 bg-sky-600 text-white rounded" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
        </form>
    )
}
