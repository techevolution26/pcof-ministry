'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiGet, deleteMember } from '@/lib/adminApi'
import Toast from '@/components/Toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faUsers,
    faArrowLeft,
    faEdit,
    faTrash,
    faToggleOn,
    faToggleOff,
    faPhone,
    faEnvelope,
    faChurch,
    faCalendar,
    faMapMarkerAlt,
    faMoneyBillWave,
    faUserCheck,
    faUserSlash,
    faSpinner,
    faIdCard,
    faVenusMars
} from '@fortawesome/free-solid-svg-icons'

export default function AdminMemberShowPage() {
    const params = useParams() as { id?: string }
    const id = params?.id
    const router = useRouter()

    const [member, setMember] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)
    const [toggling, setToggling] = useState(false)
    const [recentPayments, setRecentPayments] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<any | null>(null)

    useEffect(() => {
        if (!id) return
        let mounted = true
            ; (async () => {
                setLoading(true)
                try {
                    const body = await apiGet(`/api/admin/members/${id}`)
                    const data = body?.data ?? body
                    if (!mounted) return
                    setMember(data)

                    try {
                        const rp = await apiGet(`/api/admin/members/${id}/payments?limit=8`)
                        const payments = Array.isArray(rp) ? rp : (rp?.data ?? [])
                        if (!mounted) return
                        setRecentPayments(payments)
                    } catch (e) {
                        console.warn('failed to load recent payments', e)
                    }

                    setError(null)
                } catch (err: any) {
                    console.error('fetch member failed', err)
                    if (!mounted) return
                    setError(err?.message ?? 'Failed to load member details')
                    if (err?.status === 403 || err?.status === 404) {
                        router.replace('/admin/members')
                    }
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [id, router])

    async function handleDelete() {
        if (!member?.id) return
        if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) return
        setDeleting(true)
        try {
            await deleteMember(member.id)
            setToast({ show: true, type: 'success', message: 'Member deleted successfully' })
            setTimeout(() => router.push('/admin/members'), 600)
        } catch (err: any) {
            console.error('delete failed', err)
            setToast({ show: true, type: 'error', message: err?.message ?? 'Delete failed' })
        } finally {
            setDeleting(false)
        }
    }

    async function toggleActive() {
        if (!member?.id) return
        setToggling(true)
        try {
            const newVal = !member.is_active
            await fetch(`/api/admin/members/${member.id}`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: newVal }),
            })
            setMember(prev => prev ? { ...prev, is_active: newVal } : prev)
            setToast({ show: true, type: 'success', message: `Member ${newVal ? 'activated' : 'deactivated'} successfully` })
        } catch (err: any) {
            console.error('toggle active failed', err)
            setToast({ show: true, type: 'error', message: err?.message ?? 'Failed to update member status' })
        } finally {
            setToggling(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center gap-3 py-20">
                        <FontAwesomeIcon icon={faSpinner} className="text-blue-500 text-xl animate-spin" />
                        <div className="text-gray-600 dark:text-gray-400 font-medium text-lg">Loading member details...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8">
                        <div className="text-red-600 dark:text-red-400 text-xl font-semibold mb-4">{error}</div>
                        <Link href="/admin/members" className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                            Back to Members
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    if (!member) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="text-gray-500 dark:text-gray-400 text-xl font-semibold">Member not found</div>
                    <Link href="/admin/members" className="inline-block mt-4 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                        Back to Members
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
                            <span className="text-white font-bold text-2xl">
                                {(member.first_name?.charAt(0) + member.last_name?.charAt(0)).toUpperCase()}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {member.first_name} {member.last_name}
                            </h1>
                            <div className="flex items-center gap-4 flex-wrap">
                                {member.member_number && (
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faIdCard} className="text-blue-500 text-sm" />
                                        <span className="text-lg text-gray-700 dark:text-gray-300 font-mono">
                                            {member.member_number}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon
                                        icon={member.is_active ? faUserCheck : faUserSlash}
                                        className={member.is_active ? "text-green-500 text-sm" : "text-gray-500 text-sm"}
                                    />
                                    <span className={`text-lg font-semibold ${member.is_active
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {member.is_active ? 'Active Member' : 'Inactive Member'}
                                    </span>
                                </div>
                                {member.church?.name && (
                                    <div className="flex items-center gap-2">
                                        <FontAwesomeIcon icon={faChurch} className="text-purple-500 text-sm" />
                                        <span className="text-gray-600 dark:text-gray-400">{member.church.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/members"
                            className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 font-semibold"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back to List
                        </Link>
                        <Link
                            href={`/admin/members/${member.id}/edit`}
                            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 font-semibold"
                        >
                            <FontAwesomeIcon icon={faEdit} className="text-sm" />
                            Edit Member
                        </Link>
                        <button
                            onClick={toggleActive}
                            disabled={toggling}
                            className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50"
                        >
                            <FontAwesomeIcon
                                icon={member.is_active ? faToggleOn : faToggleOff}
                                className="text-sm"
                            />
                            {toggling ? 'Updating...' : (member.is_active ? 'Deactivate' : 'Activate')}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50"
                        >
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-lg" />
                                Member Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faIdCard} className="text-xs" />
                                        Full Name
                                    </div>
                                    <div className="font-semibold text-gray-900 dark:text-white text-lg">
                                        {member.first_name} {member.last_name}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faIdCard} className="text-xs" />
                                        Member Number
                                    </div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {member.member_number || '—'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faPhone} className="text-xs" />
                                        Phone
                                    </div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {member.phone || '—'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
                                        Email
                                    </div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {member.email || '—'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faVenusMars} className="text-xs" />
                                        Gender
                                    </div>
                                    <div className="font-semibold text-gray-900 dark:text-white capitalize">
                                        {member.gender || '—'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                                        Member Since
                                    </div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <FontAwesomeIcon icon={faChurch} className="text-xs" />
                                        Church
                                    </div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {member.church?.name || '—'}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <FontAwesomeIcon icon={member.is_active ? faUserCheck : faUserSlash} className="text-xs" />
                                        Status
                                    </div>
                                    <div className="font-semibold">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${member.is_active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                            }`}>
                                            {member.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {member.address && (
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2">
                                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                                        Address
                                    </div>
                                    <div className="text-gray-900 dark:text-white">{member.address}</div>
                                </div>
                            )}

                            {member.notes && (
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Notes</div>
                                    <div className="text-gray-900 dark:text-white whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                        {member.notes}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Recent Payments Section */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500 text-lg" />
                                Recent Payments
                            </h2>

                            {recentPayments.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-gray-400 text-xl" />
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400 font-medium">No recent payments</div>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                                        This member hasn't made any payments yet.
                                    </p>
                                    <Link
                                        href={`/admin/finance/payments/new?member_id=${member.id}`}
                                        className="inline-block mt-4 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-semibold"
                                    >
                                        Record First Payment
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentPayments.map((p: any) => (
                                        <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-white text-sm" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">
                                                        {p.type ?? 'Payment'} — {p.reference ?? `#${p.id}`}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {p.created_at ? new Date(p.created_at).toLocaleString() : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-600 dark:text-green-400 text-lg">
                                                    {p.amount ?? '—'} {p.currency ?? ''}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                    {p.status || 'completed'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-sm" />
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <Link
                                    href={`/admin/finance/payments/new?member_id=${member.id}`}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 font-semibold text-left"
                                >
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-sm" />
                                    <div>
                                        <div>Record Payment</div>
                                        <div className="text-xs opacity-80 font-normal">Add new payment</div>
                                    </div>
                                </Link>

                                <Link
                                    href={`/admin/events?member_id=${member.id}`}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 font-semibold text-left"
                                >
                                    <FontAwesomeIcon icon={faCalendar} className="text-sm" />
                                    <div>
                                        <div>View Events</div>
                                        <div className="text-xs opacity-80 font-normal">Event attendance</div>
                                    </div>
                                </Link>

                                {member.church_id && (
                                    <Link
                                        href={`/admin/church/members/${member.id}`}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 font-semibold text-left"
                                    >
                                        <FontAwesomeIcon icon={faChurch} className="text-sm" />
                                        <div>
                                            <div>Church View</div>
                                            <div className="text-xs opacity-80 font-normal">Member in church context</div>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Member Status Card */}
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Member Status</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Current Status</span>
                                    <span className={`font-semibold ${member.is_active
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {member.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Member Since</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {member.updated_at ? new Date(member.updated_at).toLocaleDateString() : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        </div>
    )
}