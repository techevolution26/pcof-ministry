// app/admin/church/designations/[id]/edit/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChurchDesignationForm from '@/components/ChurchDesignationForm'
import { fetchDesignationById } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons'

export default function EditDesignationPage() {
    const { id } = useParams() as { id?: string }
    const router = useRouter()
    const [initial, setInitial] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        if (!id) return
            ; (async () => {
                try {
                    const res = await fetchDesignationById(id)
                    const data = res?.data ?? res
                    if (!mounted) return
                    setInitial(data)
                } catch (err: any) {
                    if (!mounted) return
                    setError(err?.message ?? 'Failed to load designation')
                } finally { if (mounted) setLoading(false) }
            })()
        return () => { mounted = false }
    }, [id])

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading designation...</div>
                </div>
            </div>
        </div>
    )

    if (error) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-red-200/50 dark:border-red-700/50">
                    <div className="text-red-600 dark:text-red-400 text-center mb-4">{error}</div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 mx-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    )

    if (!initial) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
                    <div className="text-gray-600 dark:text-gray-400 text-center mb-4">Designation not found</div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 mx-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Go Back to Designations
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                        Back to Designations
                    </button>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                            Edit Designation
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Update the details for this church designation
                        </p>
                    </div>

                    <ChurchDesignationForm designationId={id} initial={initial} />
                </div>
            </div>
        </div>
    )
}