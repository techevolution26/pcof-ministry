'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import EventForm from '@/components/EventForm'

export default function EditEventPage() {
  const { id } = useParams() as { id?: string }
  if (!id) return <div>Invalid event id</div>
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Event</h1>
      <EventForm eventId={id} />
    </div>
  )
}
