// app/admin/church/events/new/page.tsx
'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import ChurchEventForm from '@/components/ChurchEventForm'

export default function NewEventPage() {
    const router = useRouter()

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">Create event</h1>
            </div>

            <ChurchEventForm onSaved={(ev) => {
                // navigate to event details after creation
                const id = ev?.id ?? (ev?.data?.id ?? null)
                if (id) router.push(`/admin/church/events/${id}`)
                else router.push('/admin/church/events')
            }} />
        </div>
    )
}
