'use client'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChurchEventForm from '@/components/ChurchEventForm'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faEdit,
    faTimesCircle
} from '@fortawesome/free-solid-svg-icons'

export default function EditEventPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id
    const id = rawId ?? null
    const router = useRouter()

    if (!id) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <FontAwesomeIcon icon={faTimesCircle} className="text-4xl text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid Event</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">The event ID provided is invalid.</p>
                    <Link
                        href="/admin/church/events"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Events
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Link
                                    href={`/admin/church/events/${id}`}
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
                                >
                                    <FontAwesomeIcon
                                        icon={faArrowLeft}
                                        className="text-sm group-hover:-translate-x-1 transition-transform"
                                    />
                                    <span className="text-sm font-medium">Back to Event</span>
                                </Link>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                Edit Event
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                                Update event details and information
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faEdit} className="text-white text-lg" />
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Editing Event</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">ID: #{id}</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Form Section */}
                <section>
                    <ChurchEventForm
                        eventId={id}
                        onSaved={(ev) => {
                            const eid = ev?.id ?? (ev?.data?.id ?? id)
                            router.push(`/admin/church/events/${eid}`)
                        }}
                    />
                </section>
            </div>
        </div>
    )
}