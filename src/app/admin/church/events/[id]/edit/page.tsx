// app/admin/church/events/[id]/edit/page.tsx
'use client'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChurchEventForm from '@/components/ChurchEventForm'

export default function EditEventPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id
    const id = rawId ?? null
    const router = useRouter()

    if (!id) return <div className="p-6 text-red-600">Invalid event id</div>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">Edit event</h1>
                <button onClick={() => router.push(`/admin/church/events/${id}`)} className="px-3 py-1 border rounded">Back</button>
            </div>

            <ChurchEventForm eventId={id} onSaved={(ev) => {
                const eid = ev?.id ?? (ev?.data?.id ?? id)
                router.push(`/admin/church/events/${eid}`)
            }} />
        </div>
    )
}
