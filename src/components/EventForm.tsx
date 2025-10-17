// src/components/EventForm.tsx
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSave,
    faCalendar,
    faChurch,
    faGlobe,
    faBuilding,
    faMapMarkerAlt,
    faFileText,
    faImage,
    faGlobeAmericas,
    faCheckCircle,
    faSpinner,
    faArrowLeft,
    faUpload
} from '@fortawesome/free-solid-svg-icons'

type Props = { eventId?: string | number }

export default function EventForm({ eventId }: Props) {
    const router = useRouter()
    const [form, setForm] = useState<unknown>({
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
    const [churches, setChurches] = useState<unknown[]>([])
    const [assemblies, setAssemblies] = useState<unknown[]>([])
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
                } catch (err) {
                    console.error('Failed to load churches', err)
                }
            })()
        return () => { mounted = false }
    }, [])

    // when church_id changes, load assemblies for that church
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
            } catch (err) {
                console.error('Failed to load assemblies', err)
            }
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

                    // existing image
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
                    console.error('Failed to load event', err)
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
                if (name === 'is_national' && checked) {
                    return { ...prev, is_national: true, church_id: '', assembly_id: '' }
                }
                if (name === 'is_national' && !checked) {
                    return { ...prev, is_national: false }
                }
                return { ...prev, [name]: checked }
            })
        } else {
            setForm(prev => ({ ...prev, [name]: value }))
        }
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null
        if (selectedPreview) {
            URL.revokeObjectURL(selectedPreview)
            setSelectedPreview(null)
        }
        if (f) {
            const url = URL.createObjectURL(f)
            setSelectedPreview(url)
            setExistingImageUrl(null)
        }
    }

    useEffect(() => {
        return () => {
            if (selectedPreview) URL.revokeObjectURL(selectedPreview)
        }
    }, [selectedPreview])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setErrors({})

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

            // Success message could be shown here
            router.push('/admin/events')
        } catch (err: unknown) {
            if (err?.status === 422 && err.errors) {
                setErrors(err.errors)
            } else {
                const msg = err?.message ?? 'Save failed'
                setErrors({ general: [msg] })
            }
        } finally {
            setSaving(false)
        }
    }

    const fieldError = (k: string) => errors?.[k] ? (
        <div className="text-red-600 text-sm mt-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faSpinner} className="text-xs" />
            {errors[k].join(' ')}
        </div>
    ) : null

    if (loading) {
        return (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
            {/* Form Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                    <FontAwesomeIcon icon={eventId ? faSave : faCalendar} className="text-blue-500" />
                    {eventId ? 'Edit Event' : 'Create New Event'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {eventId ? 'Update your event details' : 'Fill in the event information below'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* General Error */}
                {errors.general && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <div className="text-red-700 dark:text-red-300 text-sm">
                            {errors.general.join(' ')}
                        </div>
                    </div>
                )}

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faFileText} className="text-blue-500" />
                        Event Title *
                    </label>
                    <input
                        name="title"
                        value={form.title ?? ''}
                        onChange={onChange}
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-colors duration-200"
                        placeholder="Enter event title..."
                    />
                    {fieldError('title')}
                </div>

                {/* National and Church Selection */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* National Event Toggle */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input
                                    id="is_national"
                                    name="is_national"
                                    type="checkbox"
                                    checked={!!form.is_national}
                                    onChange={onChange}
                                    className="sr-only"
                                />
                                <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${form.is_national ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}>
                                    <div className={`w-5 h-5 rounded-full bg-white transform transition-transform duration-200 ${form.is_national ? 'translate-x-7' : 'translate-x-1'
                                        } mt-0.5`} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faGlobe} className="text-purple-500" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    National Event
                                </span>
                            </div>
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            National events are visible to all churches
                        </p>
                        {fieldError('is_national')}
                    </div>

                    {/* Church Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <FontAwesomeIcon icon={faChurch} className="text-green-500" />
                            Church {!form.is_national && '*'}
                        </label>
                        <select
                            name="church_id"
                            value={form.church_id ?? ''}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white appearance-none cursor-pointer transition-colors duration-200 disabled:opacity-50"
                            disabled={!!form.is_national}
                        >
                            <option value="">— Select a church —</option>
                            {churches.map((c: unknown) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {fieldError('church_id')}
                        {form.is_national && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Church selection disabled for national events
                            </p>
                        )}
                    </div>
                </div>

                {/* Assembly Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faBuilding} className="text-orange-500" />
                        Assembly (Optional)
                    </label>
                    <select
                        name="assembly_id"
                        value={form.assembly_id ?? ''}
                        onChange={onChange}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white appearance-none cursor-pointer transition-colors duration-200 disabled:opacity-50"
                        disabled={!!form.is_national || !form.church_id}
                    >
                        <option value="">— No assembly —</option>
                        {assemblies.map((a: unknown) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                    {fieldError('assembly_id')}
                    {(!form.church_id && !form.is_national) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Select a church first to see available assemblies
                        </p>
                    )}
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendar} className="text-blue-500" />
                            Start Date & Time *
                        </label>
                        <input
                            name="starts_at"
                            type="datetime-local"
                            value={form.starts_at ?? ''}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                        />
                        {fieldError('starts_at')}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendar} className="text-green-500" />
                            End Date & Time
                        </label>
                        <input
                            name="ends_at"
                            type="datetime-local"
                            value={form.ends_at ?? ''}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-colors duration-200"
                        />
                        {fieldError('ends_at')}
                    </div>
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500" />
                        Location
                    </label>
                    <input
                        name="location"
                        value={form.location ?? ''}
                        onChange={onChange}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-colors duration-200"
                        placeholder="Enter event location or venue..."
                    />
                    {fieldError('location')}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faFileText} className="text-indigo-500" />
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={form.description ?? ''}
                        onChange={onChange}
                        rows={6}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-colors duration-200 resize-vertical"
                        placeholder="Describe your event..."
                    />
                    {fieldError('description')}
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faImage} className="text-purple-500" />
                        Event Image (Optional)
                    </label>

                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        {/* File Input */}
                        <div className="flex-1">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200">
                                <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-2xl mb-3" />
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    Click to upload or drag and drop
                                </p>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={onFileChange}
                                    className="hidden"
                                    id="event-image"
                                />
                                <label
                                    htmlFor="event-image"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors duration-200 inline-block"
                                >
                                    Choose Image
                                </label>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    PNG, JPG, GIF up to 10MB
                                </p>
                            </div>
                            {fieldError('image')}
                        </div>

                        {/* Preview */}
                        <div className="flex-shrink-0">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Preview</p>
                            {selectedPreview ? (
                                <img src={selectedPreview} alt="Selected preview" className="w-48 h-36 object-cover rounded-xl border-2 border-blue-300 shadow-md" />
                            ) : existingImageUrl ? (
                                <div className="relative">
                                    <img src={existingImageUrl} alt="Existing event" className="w-48 h-36 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-md" />
                                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                        Current
                                    </div>
                                </div>
                            ) : (
                                <div className="w-48 h-36 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                                    <div className="text-center">
                                        <FontAwesomeIcon icon={faImage} className="text-gray-400 text-xl mb-2" />
                                        <p className="text-xs text-gray-400">No image</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Online Event Toggle */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input
                                id="online"
                                name="online"
                                type="checkbox"
                                checked={!!form.online}
                                onChange={onChange}
                                className="sr-only"
                            />
                            <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${form.online ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                }`}>
                                <div className={`w-5 h-5 rounded-full bg-white transform transition-transform duration-200 ${form.online ? 'translate-x-7' : 'translate-x-1'
                                    } mt-0.5`} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faGlobeAmericas} className="text-green-500" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                Online Event
                            </span>
                        </div>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Mark this event as online/virtual
                    </p>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm font-medium"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl font-medium"
                    >
                        {saving ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                {eventId ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={eventId ? faSave : faCheckCircle} />
                                {eventId ? 'Update Event' : 'Create Event'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}