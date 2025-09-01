// src/app/events/page.tsx
import EventsList from '@/components/EventsList'
import { fetchEvents } from '@/lib/api'
import type { EventItem } from '@/types'

export const revalidate = 120 // ISR: update every 2 minutes

function toIsoStringOrNull(value: unknown): string | null {
  if (value == null) return null
  const d = new Date(String(value))
  // invalid date -> return null
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function normalizeEvent(raw: unknown): EventItem | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  // id (try common variants)
  const idCandidate = obj.id ?? obj._id ?? obj.uid ?? obj.slug
  const id = idCandidate != null ? String(idCandidate) : ''

  if (!id) return null // must have an id to be useful

  const title = obj.title ?? obj.name ?? 'Untitled Event'
  const description = obj.description ?? obj.summary
  const imageUrl = obj.imageUrl ?? obj.image ?? obj.thumbnail
  const slug = obj.slug ?? undefined
  const location = obj.location ?? obj.venue

  const startsAt = toIsoStringOrNull(obj.startsAt ?? obj.startAt ?? obj.date)
  const endsAt = toIsoStringOrNull(obj.endsAt ?? obj.endAt)

  return {
    id: String(id),
    title: String(title),
    description: typeof description === 'string' ? description : undefined,
    imageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
    slug: typeof slug === 'string' ? slug : undefined,
    location: typeof location === 'string' ? location : undefined,
    startsAt: startsAt ?? undefined,
    endsAt: endsAt ?? undefined,
  }
}

export default async function EventsPage() {
  // fetchEvents might return unknown shape — treat it defensively
  const raw = await fetchEvents().catch(() => []) as unknown

  let normalized: EventItem[] = []

  if (Array.isArray(raw)) {
    normalized = raw
      .map(item => normalizeEvent(item))
      .filter((ev): ev is EventItem => ev !== null)
  } else {
    // if fetch returned a single object, try normalizing that too
    const single = normalizeEvent(raw)
    if (single) normalized = [single]
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-3 flex items-center justify-center gap-2">
            <span className="text-sky-600">📅</span> Events &amp; Programs
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
