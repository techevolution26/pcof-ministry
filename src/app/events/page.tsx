// app/events/page.tsx
import EventsList from '@/components/EventsList'
import { fetchEvents } from '@/lib/api'

export const revalidate = 120 // ISR: update every 2 minutes

export default async function EventsPage() {
  const events = (await fetchEvents().catch(() => [])) || []

  // normalize dates server-side for a consistent structure
  const normalized = (events || []).map((e: any) => ({
    ...e,
    startsAt: e.startsAt ? new Date(e.startsAt).toISOString() : null,
    endsAt: e.endsAt ? new Date(e.endsAt).toISOString() : null,
  }))

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-3 flex items-center justify-center gap-2">
            <span className="text-sky-600">📅</span> Events & Programs
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Find upcoming services, Bible studies, outreach programs, and volunteer opportunities.
          </p>
        </header>

        <EventsList initialEvents={normalized} />
      </div>
    </section>
  )
}