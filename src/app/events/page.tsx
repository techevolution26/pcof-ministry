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
      <div className="container mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Events & Programs</h1>
          <p className="text-sm text-slate-600 mt-2">Find upcoming services, Bible studies, outreach programs, and volunteer opportunities.</p>
        </header>

        <EventsList initialEvents={normalized} />
      </div>
    </section>
  )
}
