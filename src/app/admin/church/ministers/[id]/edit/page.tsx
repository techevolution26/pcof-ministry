'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ChurchMinisterForm from '@/components/ChurchMinisterForm'
import { fetchMinisterById } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faSpinner, faUserTie } from '@fortawesome/free-solid-svg-icons'

export default function EditMinisterPage() {
    const { id } = useParams() as { id?: string }
    const router = useRouter()
    const [initial, setInitial] = useState<unknown>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        if (!id) {
            setError('Minister ID is required')
            setLoading(false)
            return
        }

        (async () => {
            try {
                const res = await fetchMinisterById(id)
                const data = res?.data ?? res
                if (!mounted) return

                if (!data) {
                    setError('Minister not found')
                } else {
                    setInitial(data)
                }
            } catch (err: unknown) {
                console.error('Failed to load minister', err)
                setError(err?.message ?? 'Failed to load minister')
            } finally {
                if (mounted) setLoading(false)
            }
        })()
        return () => { mounted = false }
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center h-64">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-blue-600" />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !initial) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                        <div className="text-red-600 dark:text-red-400 text-lg mb-4">{error || 'Minister not found'}</div>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200"
                        >
                            Go Back
                        </button>
                    </div>
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
                                    href="/admin/church/ministers"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
                                >
                                    <FontAwesomeIcon
                                        icon={faArrowLeft}
                                        className="text-sm group-hover:-translate-x-1 transition-transform"
                                    />
                                    <span className="text-sm font-medium">Back to Ministers</span>
                                </Link>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                Edit Minister
                            </h1>
                            <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                                Update minister details and assignments
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faUserTie} className="text-white text-lg" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Form Section */}
                <section>
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                        <div className="p-6">
                            <ChurchMinisterForm ministerId={id} initial={initial} />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}