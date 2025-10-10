'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchAdminEventById, fetchEventRsvps } from '@/lib/adminApi'
import Toast from '@/components/Toast'

export default function EventAttendeesPage() {
    const { id } = useParams() as { id?: string }
    const router = useRouter()
    const [event, setEvent] = useState<any | null>(null)
    const [rsvps, setRsvps] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
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
                    const list = Array.isArray(res) ? res : (res?.data ?? [])
                    setRsvps(list.filter((r: any) => (r.status ?? 'attending') === 'attending'))
                } catch (err: any) {
                    console.error(err)
                    router.replace('/admin/events')
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [id, router])

    function exportCsv(list: any[]) {
        if (!list || !list.length) return
        const headers = ['id', 'member_id', 'member_name', 'church_id', 'created_at']
        const rows = list.map(r => [
            r.id ?? '',
            r.member_id ?? '',
            r.member ? `${r.member.first_name ?? ''} ${r.member.last_name ?? ''}`.trim() : (r.member_name ?? ''),
            r.church_id ?? '',
            r.created_at ?? '',
        ])
        const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `event-${id}-attendees.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) return <div>Loading…</div>
    if (!event) return <div className="text-red-600">Event not found</div>

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Attendees — {event.title}</h1>
                    <div className="text-sm text-gray-500">{event.church?.name ?? (event.is_national ? 'National' : '')}</div>
                    <div className="text-xs text-gray-400">{rsvps.length} attending</div>
                </div>

                <div className="flex gap-2">
                    <Link href={`/admin/events/${id}`} className="px-3 py-1 border rounded">Back</Link>
                    <button onClick={() => exportCsv(rsvps)} className="px-3 py-1 border rounded">Export attendees CSV</button>
                </div>
            </div>

            <section className="bg-white rounded shadow p-4">
                <div className="space-y-2">
                    {rsvps.map(r => (
                        <div key={r.id} className="flex items-center justify-between border-b py-2">
                            <div>
                                <div className="font-medium">{r.member ? `${r.member.first_name} ${r.member.last_name}` : (r.member_name ?? `Member #${r.member_id}`)}</div>
                                <div className="text-xs text-gray-500">{r.notes ?? ''}</div>
                            </div>
                            <div className="flex gap-2">
                                {r.member_id ? <Link href={`/admin/church/members/${r.member_id}`} className="text-sky-600 text-sm">View</Link> : null}
                            </div>
                        </div>
                    ))}
                    {rsvps.length === 0 && <div className="text-gray-500">No attendees yet</div>}
                </div>
            </section>

            {toast && <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    )
}
