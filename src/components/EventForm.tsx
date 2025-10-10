'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    createAdminEvent,
    createAdminEventFormData,
    updateAdminEvent,
    updateAdminEventFormData,
    fetchAdminEventById,
    fetchChurchesList,
    fetchAssemblies,
} from '@/lib/adminApi'

type Props = { eventId?: string | number }

export default function EventForm({ eventId }: Props) {
    const router = useRouter()
    const [form, setForm] = useState<any>({
        title: '',
        description: '',
        church_id: '',
        assembly_id: '',
        starts_at: '',
        ends_at: '',
        location: '',
        online: false,
        is_national: false,
    })
    const [loading, setLoading] = useState<boolean>(Boolean(eventId))
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [churches, setChurches] = useState<any[]>([])
    const [assemblies, setAssemblies] = useState<any[]>([])
    const fileRef = useRef<HTMLInputElement | null>(null)
    const [selectedPreview, setSelectedPreview] = useState<string | null>(null)
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const ch = await fetchChurchesList()
                    if (!mounted) return
                    const chList = Array.isArray(ch) ? ch : (ch?.data ?? [])
                    setChurches(chList)
                } catch (err) { /* ignore */ }
            })()
        return () => { mounted = false }
    }, [])

    // when church_id changes, optionally load assemblies for that church
    useEffect(() => {
        let mounted = true
        if (!form.church_id) {
            setAssemblies([])
            return
        }
        ; (async () => {
            try {
                const a = await fetchAssemblies({ church_id: form.church_id })
                if (!mounted) return
                const arr = Array.isArray(a) ? a : (a?.data ?? [])
                setAssemblies(arr)
            } catch (err) { /* ignore */ }
        })()
        return () => { mounted = false }
    }, [form.church_id])

    // load existing event when editing
    useEffect(() => {
        if (!eventId) { setLoading(false); return }
        let mounted = true
            ; (async () => {
                try {
                    const body = await fetchAdminEventById(eventId)
                    const data = body?.data ?? body
                    if (!mounted) return

                    setForm({
                        title: data.title ?? '',
                        description: data.description ?? '',
                        church_id: data.church_id ?? '',
                        assembly_id: data.assembly_id ?? '',
                        starts_at: data.starts_at ? data.starts_at.slice(0, 16) : '',
                        ends_at: data.ends_at ? data.ends_at.slice(0, 16) : '',
                        location: data.location ?? '',
                        online: !!data.online,
                        is_national: !!data.is_national,
                    })

                    // existing image (backend should return image_url accessor)
                    const imageUrl = data.image_url ?? (data.image_path ? (data.image_url ?? null) : null)
                    if (imageUrl) setExistingImageUrl(imageUrl)

                    // fetch assemblies immediately if editing and church_id present
                    if (data.church_id) {
                        const a = await fetchAssemblies({ church_id: data.church_id })
                        if (!mounted) return
                        const arr = Array.isArray(a) ? a : (a?.data ?? [])
                        setAssemblies(arr)
                    }
                } catch (err) {
                    console.error(err)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [eventId])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value, type } = e.target as HTMLInputElement
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked
            setForm(prev => {
                // if marking national, clear church & assemblies
                if (name === 'is_national' && checked) {
                    return { ...prev, is_national: true, church_id: '', assembly_id: '' }
                }
                // if unchecking is_national just set the flag
                return { ...prev, [name]: checked }
            })
        } else {
            setForm(prev => ({ ...prev, [name]: value }))
        }
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null
        // revoke previous preview if any
        if (selectedPreview) {
            URL.revokeObjectURL(selectedPreview)
            setSelectedPreview(null)
        }
        if (f) {
            const url = URL.createObjectURL(f)
            setSelectedPreview(url)
            // when selecting a new file, hide existing image url so preview shows the selected file
            setExistingImageUrl(null)
        }
    }

    useEffect(() => {
        // cleanup objectURL when unmount
        return () => {
            if (selectedPreview) URL.revokeObjectURL(selectedPreview)
        }
    }, [selectedPreview])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true); setErrors({})
        try {
            const payload = {
                ...form,
                starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
                ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
                is_national: !!form.is_national,
            }

            const file = fileRef.current?.files?.[0] ?? null

            if (eventId) {
                if (file) {
                    // ensure create/updateAdminEventFormData in adminApi appends is_national
                    await updateAdminEventFormData(eventId, payload, file)
                } else {
                    await updateAdminEvent(eventId, payload)
                }
            } else {
                if (file) {
                    await createAdminEventFormData(payload, file)
                } else {
                    await createAdminEvent(payload)
                }
            }

            router.push('/admin/events')
        } catch (err: any) {
            if (err?.status === 422 && err.errors) {
                setErrors(err.errors)
            } else {
                const msg = err?.message ?? 'Save failed'
                alert(msg)
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div>Loading…</div>

    const fieldError = (k: string) => errors?.[k] ? <div className="text-red-600 text-sm mt-1">{errors[k].join(' ')}</div> : null

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
            <div>
                <label className="block text-sm font-medium">Title</label>
                <input name="title" value={form.title ?? ''} onChange={onChange} required className="w-full p-2 border rounded" />
                {fieldError('title')}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Church</label>
                    <select
                        name="church_id"
                        value={form.church_id ?? ''}
                        onChange={onChange}
                        className="w-full p-2 border rounded"
                        disabled={!!form.is_national}
                    >
                        <option value="">— select church —</option>
                        {churches.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {fieldError('church_id')}
                    {form.is_national && <div className="text-xs text-gray-500 mt-1">This is a national event — visible to all churches</div>}
                </div>

                <div>
                    <label className="block text-sm font-medium">Assembly (optional)</label>
                    <select
                        name="assembly_id"
                        value={form.assembly_id ?? ''}
                        onChange={onChange}
                        className="w-full p-2 border rounded"
                        disabled={!!form.is_national || !form.church_id}
                    >
                        <option value="">— none —</option>
                        {assemblies.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    {fieldError('assembly_id')}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-1/2">
                    <label className="block text-sm font-medium">Starts</label>
                    <input name="starts_at" type="datetime-local" value={form.starts_at ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                    {fieldError('starts_at')}
                </div>
                <div className="w-1/2">
                    <label className="block text-sm font-medium">Ends</label>
                    <input name="ends_at" type="datetime-local" value={form.ends_at ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                    {fieldError('ends_at')}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium">Location</label>
                <input name="location" value={form.location ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                {fieldError('location')}
            </div>

            <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea name="description" value={form.description ?? ''} onChange={onChange} rows={6} className="w-full p-2 border rounded" />
                {fieldError('description')}
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">Image (optional)</label>

                <div className="flex items-start gap-4">
                    <div>
                        <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} />
                        {fieldError('image')}
                    </div>

                    <div>
                        {/* preview selected file or existing saved image */}
                        {selectedPreview ? (
                            <img src={selectedPreview} alt="Selected preview" className="w-40 h-32 object-cover rounded border" />
                        ) : existingImageUrl ? (
                            <img src={existingImageUrl} alt="Existing image" className="w-40 h-32 object-cover rounded border" />
                        ) : (
                            <div className="w-40 h-32 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500 border">No image</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <input id="online" name="online" type="checkbox" checked={!!form.online} onChange={onChange} />
                <label htmlFor="online" className="text-sm">Online event</label>

                <input id="is_national" name="is_national" type="checkbox" checked={!!form.is_national} onChange={onChange} className="ml-4" />
                <label htmlFor="is_national" className="text-sm">National event (visible to all churches)</label>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">
                    {saving ? 'Saving…' : eventId ? 'Save event' : 'Create event'}
                </button>
            </div>
        </form>
    )
}
