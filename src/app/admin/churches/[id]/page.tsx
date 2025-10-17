'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    fetchChurchById,
    fetchChurchMembers,
    fetchChurchAssets,
    fetchChurchEvents,
    fetchChurchPayments,
    fetchChurchFinanceSummary,
} from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faChurch,
    faUsers,
    faCalendar,
    faMoneyBillWave,
    faBox,
    faEdit,
    faArrowLeft,
    faMapMarkerAlt,
    faUserTie,
    faFileAlt,
    faSpinner,
    faPlus,
    faEye
} from '@fortawesome/free-solid-svg-icons'

type Church = { id: number | string; name?: string; address?: string; pastor?: string; description?: string;[k: string]: unknown }

export default function ChurchShowPage() {
    const params = useParams()
    const rawId = params?.id
    const idStr = Array.isArray(rawId) ? rawId[0] : rawId
    const id = idStr != null && idStr !== '' && !Number.isNaN(Number(idStr)) ? Number(idStr) : idStr
    const router = useRouter()

    const [church, setChurch] = useState<Church | null>(null)
    const [loadingChurch, setLoadingChurch] = useState(true)
    const [activeTab, setActiveTab] = useState<'members' | 'assets' | 'events' | 'collections'>('members')

    useEffect(() => {
        let mounted = true
        if (!id) return () => { mounted = false }

        setLoadingChurch(true)
        fetchChurchById(id)
            .then((body: unknown) => {
                if (!mounted) return
                const data = body?.data ?? body?.church ?? body
                setChurch(data || null)
            })
            .catch((err) => {
                if (err?.status === 401 || err?.status === 403) router.replace('/admin/login')
                else console.error('Failed to load church', err)
            })
            .finally(() => { if (mounted) setLoadingChurch(false) })
        return () => { mounted = false }
    }, [id, router])

    if (id == null) return <div>Invalid church id</div>

    if (loadingChurch) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center gap-3 py-20">
                        <FontAwesomeIcon icon={faSpinner} className="text-blue-500 text-xl animate-spin" />
                        <div className="text-gray-600 dark:text-gray-400 font-medium text-lg">Loading church details...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (!church) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="text-red-600 dark:text-red-400 text-xl font-semibold">Church not found</div>
                    <Link href="/admin/churches" className="inline-block mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                        Back to Churches
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
                    <div className="flex items-start gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <FontAwesomeIcon icon={faChurch} className="text-white text-2xl" />
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{church.name}</h1>
                            {church.pastor && (
                                <div className="flex items-center gap-3">
                                    <FontAwesomeIcon icon={faUserTie} className="text-green-500 text-sm" />
                                    <span className="text-lg text-gray-700 dark:text-gray-300">{church.pastor}</span>
                                </div>
                            )}
                            {church.address && (
                                <div className="flex items-center gap-3">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-orange-500 text-sm" />
                                    <span className="text-gray-600 dark:text-gray-400">{church.address}</span>
                                </div>
                            )}
                            {church.description && (
                                <div className="flex items-start gap-3 max-w-2xl">
                                    <FontAwesomeIcon icon={faFileAlt} className="text-purple-500 text-sm mt-1" />
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{church.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/admin/churches/${id}/edit`}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold"
                        >
                            <FontAwesomeIcon icon={faEdit} className="text-sm" />
                            Edit Church
                        </Link>
                        <Link
                            href="/admin/churches"
                            className="px-6 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 font-semibold"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back to List
                        </Link>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-2 inline-flex">
                        {([
                            { key: 'members' as const, label: 'Members', icon: faUsers, color: 'blue' },
                            { key: 'assets' as const, label: 'Assets', icon: faBox, color: 'green' },
                            { key: 'events' as const, label: 'Events', icon: faCalendar, color: 'purple' },
                            { key: 'collections' as const, label: 'Collections', icon: faMoneyBillWave, color: 'orange' }
                        ]).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 font-semibold ${activeTab === tab.key
                                    ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg`
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <FontAwesomeIcon icon={tab.icon} className="text-sm" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
                    {activeTab === 'members' && <MembersTab churchId={id} />}
                    {activeTab === 'assets' && <AssetsTab churchId={id} />}
                    {activeTab === 'events' && <EventsTab churchId={id} />}
                    {activeTab === 'collections' && <CollectionsTab churchId={id} />}
                </div>
            </div>
        </div>
    )
}

/* ----------------------- Enhanced Tab Components ----------------------- */

function normalizeList(body: unknown) {
    if (!body) return []
    if (Array.isArray(body)) return body
    if (Array.isArray(body?.data)) return body.data
    if (Array.isArray(body?.items)) return body.items
    if (Array.isArray(body?.results)) return body.results
    return []
}

/** Enhanced Members Tab */
function MembersTab({ churchId }: { churchId: string | number }) {
    const [list, setList] = useState<unknown[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true); setError(null)
        fetchChurchMembers(churchId)
            .then(body => { if (!mounted) return; setList(normalizeList(body)) })
            .catch((err) => { if (!mounted) return; setError(err?.message ?? 'Failed to load members') })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [churchId])

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex items-center justify-center gap-3 py-12">
                    <FontAwesomeIcon icon={faSpinner} className="text-blue-500 text-xl animate-spin" />
                    <div className="text-gray-600 dark:text-gray-400 font-medium">Loading members...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-700 dark:text-red-400">
                    {error}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-xl" />
                        Church Members
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        {list.length} member{list.length !== 1 ? 's' : ''} in this church
                    </p>
                </div>
                <Link
                    href={`/admin/members/new?church_id=${churchId}`}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    Add Member
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                <div className="overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                            <tr>
                                <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Member ID</th>
                                <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Name</th>
                                <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Phone</th>
                                <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Assembly</th>
                                <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((m: unknown) => (
                                <tr key={m.id} className="border-t border-gray-100 dark:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-600/50 transition-colors">
                                    <td className="p-4 font-mono text-sm text-gray-600 dark:text-gray-400">
                                        {m.member_number ?? m.id}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {m.first_name} {m.last_name}
                                        </div>
                                        {m.email && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {m.email}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-700 dark:text-gray-300">
                                        {m.phone || '—'}
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {m.assembly?.name ?? m.assembly_id ?? '—'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <Link
                                            href={`/admin/members/${m.id}`}
                                            className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                                            title="View Member"
                                        >
                                            <FontAwesomeIcon icon={faEye} className="text-xs" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {list.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                <FontAwesomeIcon icon={faUsers} className="text-gray-400 text-xl" />
                                            </div>
                                            <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                                                No members found
                                            </div>
                                            <p className="text-gray-400 dark:text-gray-500 max-w-md">
                                                Start by adding members to this church to build your community.
                                            </p>
                                            <Link
                                                href={`/admin/members/new?church_id=${churchId}`}
                                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold mt-4"
                                            >
                                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                                Add First Member
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

/** Enhanced Assets Tab */
function AssetsTab({ churchId }: { churchId: string | number }) {
    const [list, setList] = useState<unknown[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true); setError(null)
        fetchChurchAssets(churchId)
            .then(body => { if (!mounted) return; setList(normalizeList(body)) })
            .catch((err) => { if (!mounted) return; setError(err?.message ?? 'Failed to load assets') })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [churchId])

    if (loading) return <div className="p-8 text-center">Loading assets…</div>
    if (error) return <div className="p-8 text-red-600">{error}</div>

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <FontAwesomeIcon icon={faBox} className="text-green-500 text-xl" />
                        Church Assets
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage church property and equipment
                    </p>
                </div>
                <Link
                    href={`/admin/assets/new?church_id=${churchId}`}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    Add Asset
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.map((a: unknown) => (
                    <div key={a.id} className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faBox} className="text-white text-lg" />
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white text-lg">{a.name}</div>
                                {a.asset_tag && (
                                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                                        #{a.asset_tag}
                                    </div>
                                )}
                            </div>
                        </div>
                        {a.location && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-3">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                                {a.location}
                            </div>
                        )}
                        {a.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {a.description}
                            </p>
                        )}
                    </div>
                ))}
                {list.length === 0 && (
                    <div className="col-span-3 text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faBox} className="text-gray-400 text-xl" />
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                                No assets found
                            </div>
                            <p className="text-gray-400 dark:text-gray-500 max-w-md">
                                Track church property and equipment by adding assets to the inventory.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/** Enhanced Events Tab */
function EventsTab({ churchId }: { churchId: string | number }) {
    const [list, setList] = useState<unknown[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true); setError(null)
        fetchChurchEvents(churchId)
            .then(body => { if (!mounted) return; setList(normalizeList(body)) })
            .catch((err) => { if (!mounted) return; setError(err?.message ?? 'Failed to load events') })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false }
    }, [churchId])

    if (loading) return <div className="p-8 text-center">Loading events…</div>
    if (error) return <div className="p-8 text-red-600">{error}</div>

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <FontAwesomeIcon icon={faCalendar} className="text-purple-500 text-xl" />
                        Church Events
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Upcoming and past church events
                    </p>
                </div>
                <Link
                    href={`/admin/events/new?church_id=${churchId}`}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    Create Event
                </Link>
            </div>

            <div className="space-y-4">
                {list.map((e: unknown) => (
                    <div key={e.id} className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                        <FontAwesomeIcon icon={faCalendar} className="text-white text-lg" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-white text-lg">{e.title ?? e.name}</div>
                                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                            {e.starts_at ?? e.startsAt ?? e.start_date ?? 'Date TBD'}
                                        </div>
                                    </div>
                                </div>
                                {e.location && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-2">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                                        {e.location}
                                    </div>
                                )}
                                {e.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                        {e.description}
                                    </p>
                                )}
                            </div>
                            <Link
                                href={`/admin/events/${e.id}`}
                                className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors font-semibold"
                            >
                                View
                            </Link>
                        </div>
                    </div>
                ))}
                {list.length === 0 && (
                    <div className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faCalendar} className="text-gray-400 text-xl" />
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                                No events found
                            </div>
                            <p className="text-gray-400 dark:text-gray-500 max-w-md">
                                Plan and schedule church events to keep your community engaged and informed.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

/** Enhanced Collections Tab */
function CollectionsTab({ churchId }: { churchId: string | number }) {
    const [payments, setPayments] = useState<unknown[]>([])
    const [summary, setSummary] = useState<unknown>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true); setError(null)

        Promise.allSettled([
            fetchChurchPayments(churchId),
            fetchChurchFinanceSummary(churchId)
        ])
            .then(results => {
                if (!mounted) return
                const paymentsRes = results[0]
                const summaryRes = results[1]
                if (paymentsRes.status === 'fulfilled') setPayments(normalizeList(paymentsRes.value))
                if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value)
                const rej = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined
                if (rej && rej.reason && ![401, 403].includes(rej.reason?.status)) {
                    setError(rej.reason?.message ?? 'Failed to load some finance data')
                }
            })
            .catch(err => { if (mounted) setError(err?.message ?? 'Failed to load finance') })
            .finally(() => { if (mounted) setLoading(false) })

        return () => { mounted = false }
    }, [churchId])

    if (loading) return <div className="p-8 text-center">Loading collections…</div>
    if (error) return <div className="p-8 text-red-600">{error}</div>

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-orange-500 text-xl" />
                        Financial Overview
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Church finances and payment history
                    </p>
                </div>
                <Link
                    href={`/admin/finance/payments/new?church_id=${churchId}`}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold"
                >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    Record Payment
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm opacity-90">Total Payments</div>
                            <div className="text-2xl font-bold mt-2">
                                ${(summary?.total_payments ?? summary?.total_payments ?? summary?.payments_total ?? 0).toLocaleString()}
                            </div>
                            <div className="text-xs opacity-80 mt-1">Last 30 days</div>
                        </div>
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-2xl opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm opacity-90">Total Tithes</div>
                            <div className="text-2xl font-bold mt-2">
                                ${(summary?.total_tithes ?? summary?.tithes_total ?? 0).toLocaleString()}
                            </div>
                            <div className="text-xs opacity-80 mt-1">Last 30 days</div>
                        </div>
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-2xl opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm opacity-90">Recent Payments</div>
                            <div className="text-2xl font-bold mt-2">{payments.length}</div>
                            <div className="text-xs opacity-80 mt-1">Showing latest</div>
                        </div>
                        <FontAwesomeIcon icon={faCalendar} className="text-2xl opacity-80" />
                    </div>
                </div>
            </div>

            {/* Recent Payments Table */}
            <div className="bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payments</h3>
                </div>
                <div className="overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-600/50">
                            <tr>
                                <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Payment ID</th>
                                <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Type</th>
                                <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                                <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                                <th className="p-4 font-semibold text-gray-700 dark:text-gray-200">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p: unknown) => (
                                <tr key={p.id} className="border-t border-gray-100 dark:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-600/50 transition-colors">
                                    <td className="p-4 font-mono text-sm text-gray-600 dark:text-gray-400">#{p.id}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {p.type ?? p.payment_method ?? 'Payment'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-semibold text-gray-900 dark:text-white">
                                        ${(p.amount ?? 0).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${p.status === 'completed'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : p.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                            }`}>
                                            {p.status ?? 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">
                                        {p.created_at ?? p.createdAt ?? '—'}
                                    </td>
                                </tr>
                            ))}
                            {payments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        No payment records found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}