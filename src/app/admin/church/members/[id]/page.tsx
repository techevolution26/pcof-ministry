'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchMemberById } from '@/lib/adminApi'
import ChurchMemberForm from '@/components/ChurchMemberForm'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faUser,
    faPhone,
    faEnvelope,
    faUsers,
    faIdCard,
    faCalendar,
    faEdit,
    faSpinner,
    faTimesCircle,
    faChurch,
} from '@fortawesome/free-solid-svg-icons'

export default function MemberShowPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params?.id[0] : params?.id
    const id = rawId ?? null
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()

    const [member, setMember] = useState<unknown | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [unauthorized, setUnauthorized] = useState(false)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            setError(null)
            setUnauthorized(false)
            try {
                if (!id) {
                    setError('Invalid member id'); return
                }
                const body = await fetchMemberById(id as unknown)
                if (!mounted) return
                const data = body?.data ?? body
                setMember(data)

                // extra client guard: if church_admin and member not in same church -> treat as unauthorized
                if (user?.role === 'church_admin' && user?.church_id && data?.church_id && String(data.church_id) !== String(user.church_id)) {
                    setUnauthorized(true)
                }
            } catch (err: unknown) {
                console.error(err)
                // server responses from fetchWithAuth come through as { status, message, response }
                if (err?.status === 403) {
                    setUnauthorized(true)
                } else if (err?.status === 404) {
                    setError('Member not found')
                } else {
                    setError(err?.message ?? 'Failed to load member')
                }
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (!isLoading) load()
        return () => { mounted = false }
    }, [id, isLoading, user])

    if (isLoading || loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
                <div className="text-center">
                    <FontAwesomeIcon
                        icon={faSpinner}
                        className="mx-auto mb-4 text-2xl text-blue-600 animate-spin"
                    />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Loading member details...
                    </div>
                </div>
            </div>
        )
    }

    if (unauthorized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <FontAwesomeIcon icon={faTimesCircle} className="text-4xl text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        You are not authorized to view this member.
                    </p>
                    <Link
                        href="/admin/church/members"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Members
                    </Link>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <FontAwesomeIcon icon={faTimesCircle} className="text-4xl text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Member</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <Link
                        href="/admin/church/members"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Members
                    </Link>
                </div>
            </div>
        )
    }

    if (!member) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <FontAwesomeIcon icon={faUser} className="text-4xl text-gray-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Member Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">The member you&apos;re looking for doesn&apos;t exist.</p>
                    <Link
                        href="/admin/church/members"
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Members
                    </Link>
                </div>
            </div>
        )
    }

    const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ')

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/admin/church/members"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
                                >
                                    <FontAwesomeIcon
                                        icon={faArrowLeft}
                                        className="text-sm group-hover:-translate-x-1 transition-transform"
                                    />
                                    <span className="text-sm font-medium">Back to Members</span>
                                </Link>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                Member Profile
                            </h1>
                        </div>
                        <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                {fullName ? `${member.first_name?.charAt(0)}${member.last_name?.charAt(0)}` : 'M'}
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">Member Profile</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {member.member_number ? `#${member.member_number}` : `ID: ${member.id}`}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {!editing ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Personal Information */}
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <FontAwesomeIcon icon={faUser} className="text-blue-500 text-lg" />
                                    Personal Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                        <FontAwesomeIcon icon={faUser} className="text-blue-500 text-lg w-6" />
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Full Name</div>
                                            <div className="font-semibold text-gray-900 dark:text-white text-lg">
                                                {fullName || '—'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                        <FontAwesomeIcon icon={faIdCard} className="text-green-500 text-lg w-6" />
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Member Number</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {member.member_number || <span className="text-gray-400 italic">Not assigned</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                        <FontAwesomeIcon icon={faPhone} className="text-purple-500 text-lg w-6" />
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Phone</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {member.phone || <span className="text-gray-400 italic">Not provided</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                        <FontAwesomeIcon icon={faEnvelope} className="text-orange-500 text-lg w-6" />
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {member.email || <span className="text-gray-400 italic">Not provided</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Church Information */}
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <FontAwesomeIcon icon={faChurch} className="text-green-500 text-lg" />
                                    Church Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                        <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-lg w-6" />
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Assembly</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {member.assembly?.name || (member.assembly_id ? `ID: ${member.assembly_id}` : <span className="text-gray-400 italic">Not assigned</span>)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                        <FontAwesomeIcon icon={faIdCard} className="text-purple-500 text-lg w-6" />
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Designation</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {member.designation?.name || (member.designation_id ? `ID: ${member.designation_id}` : <span className="text-gray-400 italic">Not assigned</span>)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                        <FontAwesomeIcon icon={faUsers} className="text-green-500 text-lg w-6" />
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Department</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {member.department?.name || (member.department_id ? `ID: ${member.department_id}` : <span className="text-gray-400 italic">Not assigned</span>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline Information */}
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <FontAwesomeIcon icon={faCalendar} className="text-orange-500 text-lg" />
                                    Timeline Information
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                        <FontAwesomeIcon icon={faCalendar} className="text-blue-500 text-lg w-6" />
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {member.date_of_birth || <span className="text-gray-400 italic">Not provided</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl">
                                        <FontAwesomeIcon icon={faCalendar} className="text-green-500 text-lg w-6" />
                                        <div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">Membership Date</div>
                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                {member.membership_date || <span className="text-gray-400 italic">Not provided</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                        Edit Member
                                    </button>

                                    <Link
                                        href="/admin/church/members"
                                        className="w-full py-3 px-4 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} />
                                        Back to Members
                                    </Link>
                                </div>
                            </div>

                            {/* Member Summary */}
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Member Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Member ID</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">#{member.id}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Church ID</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">#{member.church_id}</span>
                                    </div>
                                    {member.created_at && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {new Date(member.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    {member.updated_at && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {new Date(member.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <ChurchMemberForm
                            memberId={member.id}
                            initial={member}
                            onSaved={(saved) => { setMember(saved); setEditing(false) }}
                            onCancel={() => setEditing(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}