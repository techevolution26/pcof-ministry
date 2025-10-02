'use client'
import React from 'react'
import EventForm from '@/components/EventForm'

export default function NewEventPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create Event</h1>
      <EventForm />
    </div>
  )
}
