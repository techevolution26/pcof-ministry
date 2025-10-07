'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchMemberById } from '@/lib/adminApi'
import MemberForm from '@/components/MemberForm'

export default function MemberShowPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params?.id[0] : params?.id
    const id = rawId ?? null
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()

    const [member, setMember] = useState<any | null>(null)
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
                const body = await fetchMemberById(id as any)
                if (!mounted) return
                const data = body?.data ?? body
                setMember(data)

                // extra client guard: if church_admin and member not in same church -> treat as unauthorized
                if (user?.role === 'church_admin' && user?.church_id && data?.church_id && String(data.church_id) !== String(user.church_id)) {
                    setUnauthorized(true)
                }
            } catch (err: any) {
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

    if (isLoading || loading) return <div className="p-6 text-gray-500">Loading member…</div>
    if (unauthorized) return <div className="p-6 text-red-600">You are not authorized to view this member.</div>
    if (error) return <div className="p-6 text-red-600">{error}</div>
    if (!member) return <div className="p-6 text-gray-500">Member not found</div>

    return (
        <div>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h1 className="text-xl font-semibold">{[member.first_name, member.last_name].filter(Boolean).join(' ')}</h1>
                    <div className="text-sm text-gray-500">{member.member_number ?? `ID ${member.id}`}</div>
                </div>

                <div className="flex gap-2">
                    {!editing && <button onClick={() => setEditing(true)} className="px-3 py-1 border rounded">Edit</button>}
                    <Link href="/admin/church/members" className="px-3 py-1 border rounded">Back</Link>
                </div>
            </div>

            {!editing ? (
                <div className="bg-white rounded shadow p-4">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <dt className="text-xs text-gray-500">Phone</dt>
                            <dd>{member.phone ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Email</dt>
                            <dd>{member.email ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Assembly</dt>
                            <dd>{member.assembly?.name ?? member.assembly_id ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Designation</dt>
                            <dd>{member.designation?.name ?? member.designation_id ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Department</dt>
                            <dd>{member.department?.name ?? member.department_id ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">DOB</dt>
                            <dd>{member.date_of_birth ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Membership date</dt>
                            <dd>{member.membership_date ?? '—'}</dd>
                        </div>
                    </dl>
                </div>
            ) : (
                <div>
                    <MemberForm
                        memberId={member.id}
                        initial={member}
                        onSaved={(saved) => { setMember(saved); setEditing(false) }}
                        onCancel={() => setEditing(false)}
                    />
                </div>
            )}
        </div>
    )
}
