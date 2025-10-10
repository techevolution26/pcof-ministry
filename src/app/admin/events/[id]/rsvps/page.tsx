'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/Toast'
import ChurchMemberTypeahead from '@/components/ChurchMemberTypeahead'
import { fetchAdminEventById, fetchEventRsvps, createEventRsvp, deleteEventRsvp } from '@/lib/adminApi'

export default function EventRsvpsPage() {
    const { id } = useParams() as { id?: string }
    const router = useRouter()
    const [event, setEvent] = useState<any | null>(null)
    const [rsvps, setRsvps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [addingMember, setAddingMember] = useState<any | null>(null)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<any | null>(null)

    useEffect(() => {
        if (!id) return
        let mounted = true
            ; (async () => {
                setLoading(true)
                try {
                    const ev = await fetchAdminEventById(id)
                    if (!mounted) return
                    setEvent(ev?.data ?? ev)
                    const res = await fetchEventRsvps(id)
                    if (!mounted) return
                    setRsvps(Array.isArray(res) ? res : (res?.data ?? []))
                } catch (err: any) {
                    console.error(err)
                    router.replace('/admin/events')
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [id, router])

    async function handleAdd() {
        if (!addingMember) {
            setToast({ show: true, message: 'Pick a member to add', type: 'error' })
            return
        }
        setSaving(true)
        try {
            const payload = {
                event_id: id,
                member_id: addingMember.id,
                church_id: event?.church_id ?? null,
                status: 'attending',
            }
            const res = await createEventRsvp(payload)
            const saved = res?.data ?? res
            setRsvps(prev => [saved, ...prev])
            setAddingMember(null)
            setToast({ show: true, message: 'Attendee added', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to add', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    async function handleRemove(rsvp: any) {
        if (!confirm('Remove attendee?')) return
        try {
            await deleteEventRsvp(rsvp.id)
            setRsvps(prev => prev.filter(x => x.id !== rsvp.id))
            setToast({ show: true, message: 'Removed', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Remove failed', type: 'error' })
        }
    }

    // attendee counts
    const counts = rsvps.reduce((acc: any, r: any) => {
        const s = r.status ?? 'attending'
        acc[s] = (acc[s] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    function exportCsv(list: any[]) {
        if (!list || !list.length) return
        const headers = ['id', 'member_id', 'member_name', 'status', 'notes', 'church_id', 'created_at']
        const rows = list.map(r => [
            r.id ?? '',
            r.member_id ?? '',
            r.member ? `${r.member.first_name ?? ''} ${r.member.last_name ?? ''}`.trim() : (r.member_name ?? ''),
            r.status ?? '',
            (r.notes ?? '').replace(/\r?\n/g, ' '),
            r.church_id ?? '',
            r.created_at ?? '',
        ])
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `event-${id}-rsvps.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) return <div>Loading…</div>
    if (!event) return <div className="text-red-600">Event not found</div>

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">RSVPs — {event.title}</h1>
                    <div className="text-sm text-gray-500">{event.church?.name ?? (event.is_national ? 'National' : '')}</div>
                </div>

                <div className="flex gap-2">
                    <Link href={`/admin/events/${id}`} className="px-3 py-1 border rounded">Back</Link>
                    <button onClick={() => exportCsv(rsvps)} className="px-3 py-1 border rounded">Export CSV</button>
                </div>
            </div>

            <div className="bg-white rounded shadow p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm text-gray-600">Add attendee (church members)</div>
                    <div className="text-sm text-gray-500">Counts — attending: {counts['attending'] ?? 0} • interested: {counts['interested'] ?? 0} • cancelled: {counts['cancelled'] ?? 0}</div>
                </div>

                <div className="flex gap-2 items-start">
                    <div className="flex-1">
                        <ChurchMemberTypeahead churchId={event.church_id ?? undefined} onSelect={m => setAddingMember(m)} value={addingMember} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleAdd} disabled={saving} className="px-3 py-1 bg-sky-600 text-white rounded">{saving ? 'Adding…' : 'Add'}</button>
                        <button onClick={() => setAddingMember(null)} className="px-3 py-1 border rounded">Clear</button>
                    </div>
                </div>
            </div>

            <section className="bg-white rounded shadow p-4">
                <h2 className="text-lg font-semibold mb-3">RSVP list ({rsvps.length})</h2>
                <div className="space-y-2">
                    {rsvps.map(r => (
                        <div key={r.id} className="flex items-center justify-between border-b py-2">
                            <div>
                                <div className="font-medium">{r.member ? `${r.member.first_name} ${r.member.last_name}` : (r.member_name ?? `Member #${r.member_id}`)}</div>
                                <div className="text-xs text-gray-500">{r.status} • {r.notes ?? ''}</div>
                            </div>
                            <div className="flex gap-2">
                                {r.member_id ? <Link href={`/admin/church/members/${r.member_id}`} className="text-sky-600 text-sm">View</Link> : null}
                                <button onClick={() => handleRemove(r)} className="text-red-600 text-sm">Remove</button>
                            </div>
                        </div>
                    ))}
                    {rsvps.length === 0 && <div className="text-gray-500">No RSVPs yet</div>}
                </div>
            </section>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
