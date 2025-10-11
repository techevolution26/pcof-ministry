//src/admin/members/[id]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiGet, deleteMember } from '@/lib/adminApi'
import Toast from '@/components/Toast'

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
                    // fetch member
                    const body = await apiGet(`/api/admin/members/${id}`)
                    const data = body?.data ?? body
                    if (!mounted) return
                    setMember(data)

                    // try to fetch recent payments (optional)
                    try {
                        const rp = await apiGet(`/api/admin/members/${id}/payments?limit=8`)
                        const payments = Array.isArray(rp) ? rp : (rp?.data ?? [])
                        if (!mounted) return
                        setRecentPayments(payments)
                    } catch (e) {
                        // ignore payments error
                        console.warn('failed to load recent payments', e)
                    }

                    setError(null)
                } catch (err: any) {
                    console.error('fetch member failed', err)
                    if (!mounted) return
                    setError(err?.message ?? 'Failed to load member')
                    // redirect on not-authorized / not-found
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
        if (!confirm('Delete this member? This cannot be undone.')) return
        setDeleting(true)
        try {
            await deleteMember(member.id)
            setToast({ show: true, type: 'success', message: 'Member deleted' })
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
            setToast({ show: true, type: 'success', message: `Member ${newVal ? 'activated' : 'deactivated'}` })
        } catch (err: any) {
            console.error('toggle active failed', err)
            setToast({ show: true, type: 'error', message: err?.message ?? 'Update failed' })
        } finally {
            setToggling(false)
        }
    }

    if (loading) return <div className="p-6 text-gray-500">Loading member…</div>
    if (error) return <div className="p-6 text-red-600">{error}</div>
    if (!member) return <div className="p-6 text-gray-500">Member not found.</div>

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{member.first_name} {member.last_name}</h1>
                    <div className="text-sm text-gray-500">{member.member_number ?? `ID: ${member.id}`}</div>
                    <div className="text-xs text-gray-400">{member.church?.name ?? '—'}</div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/admin/members" className="px-3 py-1 border rounded">Back</Link>
                    <Link href={`/admin/members/${member.id}/edit`} className="px-3 py-1 border rounded">Edit</Link>
                    <button onClick={toggleActive} disabled={toggling} className="px-3 py-1 border rounded">
                        {toggling ? 'Updating…' : (member.is_active ? 'Deactivate' : 'Activate')}
                    </button>
                    <button onClick={handleDelete} disabled={deleting} className="px-3 py-1 bg-red-50 text-red-600 border rounded">
                        {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2 bg-white rounded shadow p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs text-gray-500">Name</div>
                            <div className="font-medium">{member.first_name} {member.last_name}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Member number</div>
                            <div className="font-medium">{member.member_number ?? '—'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Phone</div>
                            <div className="font-medium">{member.phone ?? '—'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Email</div>
                            <div className="font-medium">{member.email ?? '—'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Status</div>
                            <div className="font-medium">{member.is_active ? 'Active' : 'Inactive'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Joined</div>
                            <div className="font-medium">{member.created_at ? new Date(member.created_at).toLocaleString() : '—'}</div>
                        </div>
                    </div>

                    {member.address && (
                        <div className="mt-4">
                            <div className="text-xs text-gray-500">Address</div>
                            <div>{member.address}</div>
                        </div>
                    )}

                    <div className="mt-4">
                        <div className="text-xs text-gray-500">Notes</div>
                        <div className="whitespace-pre-wrap">{member.notes ?? '—'}</div>
                    </div>
                </div>

                <aside className="bg-white rounded shadow p-4">
                    <h3 className="text-sm font-semibold mb-3">Quick actions</h3>
                    <div className="flex flex-col gap-2">
                        <Link href={`/admin/finance/payments/new?member_id=${member.id}`} className="px-3 py-2 border rounded text-sm">Record payment</Link>
                        <Link href={`/admin/events?member_id=${member.id}`} className="px-3 py-2 border rounded text-sm">View events</Link>
                        <Link href={`/admin/church/members/${member.id}`} className="px-3 py-2 border rounded text-sm">Open church view</Link>
                    </div>
                </aside>
            </div>

            <section className="bg-white rounded shadow p-4">
                <h2 className="text-lg font-semibold mb-3">Recent payments</h2>
                {recentPayments.length === 0 ? (
                    <div className="text-sm text-gray-500">No recent payments</div>
                ) : (
                    <ul className="divide-y">
                        {recentPayments.map((p: any) => (
                            <li key={p.id} className="py-2 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{p.type ?? 'Payment'} — {p.reference ?? `#${p.id}`}</div>
                                    <div className="text-xs text-gray-500">{p.created_at ? new Date(p.created_at).toLocaleString() : '—'}</div>
                                </div>
                                <div className="font-semibold">{p.amount ?? '—'} {p.currency ?? ''}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* <section className="bg-white rounded shadow p-4">
                <h3 className="text-xs text-gray-500 mb-2">Raw</h3>
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">{JSON.stringify(member, null, 2)}</pre>
            </section> */}

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
