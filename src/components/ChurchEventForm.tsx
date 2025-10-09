// src/components/EventForm.tsx
'use client'
import React, { useEffect, useState } from 'react'
import Toast from './Toast'
import { createAdminEventFormData, updateAdminEventFormData, fetchEventById } from '@/lib/adminApi'
import { useAdminAuth } from '@/hooks/useAdminAuth'

type Props = {
    eventId?: string | number | null
    initial?: any
    onSaved?: (event: any) => void
}

export default function EventForm({ eventId = null, initial = {}, onSaved }: Props) {
    const { user, isLoading } = useAdminAuth()
    const [form, setForm] = useState<any>({
        title: initial.title ?? '',
        description: initial.description ?? '',
        church_id: initial.church_id ?? (user?.church_id ?? ''),
        assembly_id: initial.assembly_id ?? '',
        starts_at: initial.starts_at ?? '',
        ends_at: initial.ends_at ?? '',
        location: initial.location ?? '',
        online: initial.online ? true : false,
    })
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(initial.image_url ?? null)
    const [loading, setLoading] = useState<boolean>(Boolean(eventId))
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<any>(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!eventId) { setLoading(false); return }
            try {
                const body = await fetchEventById(eventId as any)
                const data = body?.data ?? body
                if (!mounted) return
                setForm({
                    title: data.title ?? '',
                    description: data.description ?? '',
                    church_id: data.church_id ?? (user?.church_id ?? ''),
                    assembly_id: data.assembly_id ?? '',
                    starts_at: data.starts_at ? data.starts_at.slice(0, 19) : '',
                    ends_at: data.ends_at ? data.ends_at.slice(0, 19) : '',
                    location: data.location ?? '',
                    online: !!data.online,
                })
                setPreviewUrl(data.image_url ?? null)
            } catch (err) {
                console.error('Failed to load event', err)
                setToast({ show: true, message: 'Failed to load event', type: 'error' })
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [eventId, user?.church_id])

    useEffect(() => {
        if (!imageFile) { setPreviewUrl(initial.image_url ?? null); return }
        const url = URL.createObjectURL(imageFile)
        setPreviewUrl(url)
        return () => { URL.revokeObjectURL(url) }
    }, [imageFile])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value, type, checked } = e.target as any
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null
        setImageFile(f)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            // Normalize booleans and empty strings
            const payload: Record<string, any> = { ...form }
            if (payload.online === undefined) payload.online = false

            if (eventId) {
                // update with FormData helper (sends POST + _method=PUT if needed)
                const res = await updateAdminEventFormData(eventId as any, payload, imageFile ?? undefined)
                const saved = res?.data ?? res
                setToast({ show: true, message: 'Event updated', type: 'success' })
                onSaved?.(saved)
            } else {
                const res = await createAdminEventFormData(payload, imageFile ?? undefined)
                const saved = res?.data ?? res
                setToast({ show: true, message: 'Event created', type: 'success' })
                onSaved?.(saved)
            }
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Save failed', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-6 text-gray-500">Loading event…</div>

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded shadow p-4 space-y-4">
            <div>
                <label className="block text-xs text-gray-600">Title</label>
                <input name="title" value={form.title} onChange={onChange} required className="w-full p-2 border rounded" />
            </div>

            <div>
                <label className="block text-xs text-gray-600">Description</label>
                <textarea name="description" value={form.description} onChange={onChange} className="w-full p-2 border rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-gray-600">Starts at</label>
                    <input type="datetime-local" name="starts_at" value={form.starts_at ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block text-xs text-gray-600">Ends at</label>
                    <input type="datetime-local" name="ends_at" value={form.ends_at ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-gray-600">Location</label>
                    <input name="location" value={form.location} onChange={onChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                        <input type="checkbox" name="online" checked={!!form.online} onChange={onChange} />
                        <span>Online event</span>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-xs text-gray-600">Image (optional)</label>
                <input type="file" accept="image/*" onChange={onFile} />
                {previewUrl && <img src={previewUrl} alt="preview" className="mt-2 max-h-40 object-contain rounded border" />}
            </div>

            <div className="flex justify-end gap-2">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">
                    {saving ? 'Saving…' : eventId ? 'Update event' : 'Create event'}
                </button>
            </div>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </form>
    )
}
