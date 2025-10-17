'use client'
import React, { useEffect, useState } from 'react'
import Toast from './Toast'
import { createAdminEventFormData, updateAdminEventFormData, fetchEventById } from '@/lib/adminApi'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faCalendar,
    faFileAlt,
    faMapMarkerAlt,
    faGlobe,
    faImage,
    faClock,
    faSave,
    faPlus,
    faSpinner,
    faTimes
} from '@fortawesome/free-solid-svg-icons'

type Props = {
    eventId?: string | number | null
    initial?: unknown
    onSaved?: (event: unknown) => void
}

export default function EventForm({ eventId = null, initial = {}, onSaved }: Props) {
    const { user } = useAdminAuth()
    const [form, setForm] = useState<unknown>({
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
    const [toast, setToast] = useState<unknown>(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!eventId) { setLoading(false); return }
            try {
                const body = await fetchEventById(eventId as unknown)
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
        if (!imageFile) {
            if (!initial.image_url) setPreviewUrl(null)
            return
        }
        const url = URL.createObjectURL(imageFile)
        setPreviewUrl(url)
        return () => { URL.revokeObjectURL(url) }
    }, [imageFile, initial.image_url])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const { name, value, type, checked } = e.target as unknown
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null
        setImageFile(f)
    }

    function clearImage() {
        setImageFile(null)
        setPreviewUrl(null)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            // Normalize booleans and empty strings
            const payload: Record<string, unknown> = { ...form }
            if (payload.online === undefined) payload.online = false

            if (eventId) {
                // update with FormData helper (sends POST + _method=PUT if needed)
                const res = await updateAdminEventFormData(eventId as unknown, payload, imageFile ?? undefined)
                const saved = res?.data ?? res
                setToast({ show: true, message: 'Event updated successfully', type: 'success' })
                onSaved?.(saved)
            } else {
                const res = await createAdminEventFormData(payload, imageFile ?? undefined)
                const saved = res?.data ?? res
                setToast({ show: true, message: 'Event created successfully', type: 'success' })
                onSaved?.(saved)
            }
        } catch (err: unknown) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Save failed. Please try again.', type: 'error' })
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
                        Loading event details...
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
                        <FontAwesomeIcon icon={faCalendar} className="text-blue-500 text-lg" />
                        Basic Information
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Event Title *
                            </label>
                            <div className="relative">
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={onChange}
                                    required
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11"
                                    placeholder="Enter event title"
                                />
                                <FontAwesomeIcon
                                    icon={faCalendar}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Event Description
                            </label>
                            <div className="relative">
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={onChange}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11 resize-vertical"
                                    placeholder="Describe your event..."
                                />
                                <FontAwesomeIcon
                                    icon={faFileAlt}
                                    className="absolute left-4 top-4 transform -translate-y-0 text-gray-400 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Date & Time Section */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faClock} className="text-green-500 text-lg" />
                        Date & Time
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Start Date & Time *
                            </label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    name="starts_at"
                                    value={form.starts_at ?? ''}
                                    onChange={onChange}
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white pl-11"
                                />
                                <FontAwesomeIcon
                                    icon={faClock}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                End Date & Time
                            </label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    name="ends_at"
                                    value={form.ends_at ?? ''}
                                    onChange={onChange}
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white pl-11"
                                />
                                <FontAwesomeIcon
                                    icon={faClock}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Location & Details Section */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-purple-500 text-lg" />
                        Location & Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Event Location
                            </label>
                            <div className="relative">
                                <input
                                    name="location"
                                    value={form.location}
                                    onChange={onChange}
                                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-11"
                                    placeholder="Enter event location"
                                />
                                <FontAwesomeIcon
                                    icon={faMapMarkerAlt}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Event Type
                            </label>
                            <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                                <input
                                    type="checkbox"
                                    name="online"
                                    checked={!!form.online}
                                    onChange={onChange}
                                    className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faGlobe} className="text-blue-500" />
                                    <span className="font-medium text-gray-900 dark:text-white">Online Event</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
                                    {form.online ? 'This is an online event' : 'This is an in-person event'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Image Upload Section */}
                <section>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <FontAwesomeIcon icon={faImage} className="text-orange-500 text-lg" />
                        Event Image
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Upload Image (Optional)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onFile}
                                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Recommended: Square image, 500x500px or larger. JPG, PNG, or WebP formats.
                            </p>
                        </div>

                        {/* Image Preview */}
                        {previewUrl && (
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Image Preview</span>
                                    <button
                                        type="button"
                                        onClick={clearImage}
                                        className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                        Remove
                                    </button>
                                </div>
                                <div className="bg-white/50 dark:bg-gray-700/50 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-4">
                                    <img
                                        src={previewUrl}
                                        alt="Event preview"
                                        className="max-h-64 w-full object-contain rounded-xl"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {eventId ? 'Update your event details' : 'Create a new event for your church'}
                    </div>

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
                                <FontAwesomeIcon icon={eventId ? faSave : faPlus} />
                                {eventId ? 'Update Event' : 'Create Event'}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}