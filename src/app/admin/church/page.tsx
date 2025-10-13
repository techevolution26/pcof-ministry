'use client'
import React, { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchChurchById, fetchChurchSummary } from '@/lib/adminApi'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faChurch,
    faUsers,
    faMoneyBillWave,
    faChartLine,
    faCog,
    faEye,
    faUserPlus,
    faPlus,
    faHome,
    faCalendar,
    faReceipt,
    faSpinner,
    faArrowRight
} from '@fortawesome/free-solid-svg-icons'

export default function ChurchDashboardPage() {
    const { user, isLoading } = useAdminAuth()
    const [church, setChurch] = useState<any | null>(null)
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const churchId = user?.church_id

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                if (!churchId) return
                // fetch summary (includes church object and finance + recent items)
                const body = await fetchChurchSummary(churchId)
                if (!mounted) return
                const ch = body?.church ?? (body?.church_id ? await fetchChurchById(churchId) : null)
                setChurch(ch)
                setSummary(body)
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [churchId, isLoading])

    if (isLoading || loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <FontAwesomeIcon
                        icon={faSpinner}
                        className="mx-auto mb-4 text-2xl text-blue-600 animate-spin"
                    />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Loading church dashboard...
                    </div>
                </div>
            </div>
        )
    }

    if (!church) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <FontAwesomeIcon icon={faChurch} className="text-4xl text-gray-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Church Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        No church is associated with your account. Please contact support.
                    </p>
                    <Link
                        href="/admin"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                            Church Dashboard
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faChurch} className="text-white text-lg" />
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-gray-900 dark:text-white">{church.name}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{church.address}</div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/admin/church`}
                            className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 flex items-center gap-2 group"
                        >
                            <FontAwesomeIcon icon={faEye} className="group-hover:scale-110 transition-transform" />
                            View Church
                        </Link>
                        <Link
                            href={`/admin/church/settings`}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faCog} />
                            Settings
                        </Link>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <section>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Members Card */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Members</div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                    {summary?.members_count ?? church?.members_count ?? '0'}
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faUsers} className="text-white text-lg" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <Link
                                href="/admin/church/members"
                                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 group"
                            >
                                Manage members
                                <FontAwesomeIcon icon={faArrowRight} className="text-xs group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Collections Card */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Collections (30d)</div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                    {formatCurrency(summary?.payments?.total ?? 0)}
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-white text-lg" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <Link
                                href="/admin/church/finance"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 group"
                            >
                                View finances
                                <FontAwesomeIcon icon={faArrowRight} className="text-xs group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Tithes Card */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Tithes (30d)</div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                    {formatCurrency(summary?.tithes?.total ?? 0)}
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faChartLine} className="text-white text-lg" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <Link
                                href="/admin/church/finance/tithes"
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 group"
                            >
                                Tithes report
                                <FontAwesomeIcon icon={faArrowRight} className="text-xs group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Recent Activity Card */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Activity</div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                    {summary?.recent_payments?.length ?? 0}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">new payments</div>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                <FontAwesomeIcon icon={faReceipt} className="text-white text-lg" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <Link
                                href="/admin/church/finance/payments"
                                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 group"
                            >
                                View all
                                <FontAwesomeIcon icon={faArrowRight} className="text-xs group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Payments Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                                <FontAwesomeIcon icon={faReceipt} className="text-green-500 text-lg" />
                                Recent Payments
                            </h2>
                        </div>
                        <div className="p-6">
                            {summary?.recent_payments?.length > 0 ? (
                                <div className="space-y-4">
                                    {summary.recent_payments.map((p: any) => (
                                        <div key={p.id} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl hover:bg-white dark:hover:bg-gray-700 transition-colors duration-200">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-white text-sm" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {p.type ?? 'Payment'} — {p.reference ?? `#${p.id}`}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {p.member_id ? `Member #${p.member_id}` : 'Guest'} • {new Date(p.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(p.amount)} {p.currency ?? ''}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                    {p.payment_method ?? ''}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <FontAwesomeIcon icon={faReceipt} className="text-4xl text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Recent Payments</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        No payment transactions recorded in the last 30 days.
                                    </p>
                                    <Link
                                        href="/admin/church/finance/payments/new"
                                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                        Record Payment
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div className="space-y-6">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                            <FontAwesomeIcon icon={faPlus} className="text-blue-500 text-lg" />
                            Quick Actions
                        </h2>
                        <div className="space-y-3">
                            <Link
                                href="/admin/church/members/new"
                                className="w-full p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 group"
                            >
                                <FontAwesomeIcon icon={faUserPlus} className="group-hover:scale-110 transition-transform" />
                                <span>Add New Member</span>
                            </Link>

                            <Link
                                href="/admin/church/assets/new"
                                className="w-full p-4 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:shadow-lg transition-all duration-200 flex items-center gap-3 group"
                            >
                                <FontAwesomeIcon icon={faHome} className="group-hover:scale-110 transition-transform" />
                                <span>Add Church Asset</span>
                            </Link>

                            <Link
                                href="/admin/church/finance/payments/new"
                                className="w-full p-4 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-400 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:shadow-lg transition-all duration-200 flex items-center gap-3 group"
                            >
                                <FontAwesomeIcon icon={faMoneyBillWave} className="group-hover:scale-110 transition-transform" />
                                <span>Record Payment</span>
                            </Link>

                            <Link
                                href="/admin/church/events/new"
                                className="w-full p-4 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-400 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:shadow-lg transition-all duration-200 flex items-center gap-3 group"
                            >
                                <FontAwesomeIcon icon={faCalendar} className="group-hover:scale-110 transition-transform" />
                                <span>Create Event</span>
                            </Link>
                        </div>
                    </div>

                    {/* Church Info Card */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Church Information</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Members</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{summary?.members_count ?? '0'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Church ID</span>
                                <span className="font-semibold text-gray-900 dark:text-white">#{church.id}</span>
                            </div>
                            {church.phone && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Phone</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{church.phone}</span>
                                </div>
                            )}
                            {church.email && (
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{church.email}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}