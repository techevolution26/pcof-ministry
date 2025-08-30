// app/events/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RSVPForm from '@/components/RSVPForm'
import { fetchEvents } from '@/lib/api'

export const revalidate = 60 // ISR: refresh once a minute

export async function generateMetadata({ params }: { params: { id: string } }) {
  const events = await fetchEvents().catch(() => [])
  const awaitedParams = await params
  const ev = (events || []).find((e: any) => e.id === awaitedParams.id)
  if (!ev) return { title: 'Event — PCOF' }

  return {
    title: ev.title,
    description: ev.description?.slice(0, 150) ?? `Join ${ev.title} hosted by ${ev.host || 'PCOF'}`,
    openGraph: {
      title: ev.title,
      description: ev.description?.slice(0, 150) ?? '',
      images: ev.image ? [ev.image] : undefined,
    },
  }
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const events = await fetchEvents().catch(() => [])
  const awaitedParams = await params
  const event = (events || []).find((e: any) => e.id === awaitedParams.id)

  if (!event) {
    notFound()
  }

  const starts = event.startsAt ? new Date(event.startsAt) : null
  const ends = event.endsAt ? new Date(event.endsAt) : null

  // JSON-LD for SEO / rich results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "startDate": event.startsAt,
    "endDate": event.endsAt,
    "description": event.description ?? '',
    "location": event.locationUrl
      ? {
          "@type": "Place",
          "name": event.location ?? 'Venue',
          "url": event.locationUrl,
          "address": event.address ?? undefined
        }
      : (event.online ? { "@type": "VirtualLocation", "url": event.onlineUrl ?? undefined } : undefined),
    "organizer": {
      "@type": "Organization",
      "name": event.host ?? 'PCOF'
    },
    "eventStatus": event.canceled ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    "eventAttendanceMode": event.online ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode"
  }

  // helper display strings
  const startLabel = starts ? starts.toLocaleString() : 'TBD'
  const endLabel = ends ? ends.toLocaleString() : null

  return (
    <article className="py-8">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="text-sm text-slate-600 mt-1">{event.host ?? 'PCOF'}</div>

          <div className="mt-4 text-sm">
            <strong>When:</strong> {startLabel}{endLabel ? ` — ${endLabel}` : ''}
            {event.timezone ? <span className="ml-2 text-xs text-slate-500">({event.timezone})</span> : null}
          </div>

          <div className="mt-2 text-sm">
            <strong>Where:</strong> {event.location ? event.location : (event.online ? 'Online' : 'TBD')}
            {event.locationUrl ? (
              <a className="ml-2 underline" href={event.locationUrl} target="_blank" rel="noreferrer">Directions</a>
            ) : null}
            {event.online && event.onlineUrl ? (
              <a className="ml-2 underline" href={event.onlineUrl} target="_blank" rel="noreferrer">Join online</a>
            ) : null}
          </div>

          {event.image ? (
            <div className="mt-4 w-full h-56 relative overflow-hidden rounded">
              {/* Next/Image recommended; use plain img if not configured */}
              {/* <Image src={event.image} alt={event.title} fill style={{ objectFit: 'cover' }} /> */}
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            </div>
          ) : null}

          <div className="mt-6 text-slate-700 leading-relaxed whitespace-pre-line">
            {event.description ?? 'No description provided.'}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/api/events/${event.id}/ics`} className="px-3 py-2 border rounded text-sm">Download iCal</Link>

            <a
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title || '')}&dates=${starts ? starts.toISOString().replace(/[-:]|\.\d{3}/g,'') : ''}/${ends ? ends.toISOString().replace(/[-:]|\.\d{3}/g,'') : ''}&details=${encodeURIComponent(event.description || '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 border rounded text-sm"
            >
              Add to Google Calendar
            </a>

            <Link href="/events" className="px-3 py-2 border rounded text-sm">Back to events</Link>
          </div>

          <div id="rsvp" className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Register / RSVP</h2>
            <RSVPForm eventId={event.id} capacity={event.capacity} />
          </div>

          {/* JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </main>

        <aside className="space-y-4">
          <div className="bg-white border rounded p-4">
            <div className="text-sm text-slate-500">Hosted by</div>
            <div className="font-medium">{event.host ?? 'PCOF'}</div>
            {event.contactEmail && (
              <div className="text-sm mt-1">Email: <a className="underline" href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a></div>
            )}
            {event.contactPhone && (
              <div className="text-sm mt-1">Phone: <a className="underline" href={`tel:${event.contactPhone}`}>{event.contactPhone}</a></div>
            )}
          </div>

          <div className="bg-white border rounded p-4">
            <div className="text-sm text-slate-500">Need help?</div>
            <div className="text-sm mt-2">Contact the host or the PCOF office for assistance.</div>
            <div className="mt-3">
              <Link href="/contact" className="text-sm underline">Contact us</Link>
            </div>
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="bg-white border rounded p-4">
              <div className="text-sm text-slate-500">Tags</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {event.tags.map((t: string) => (
                  <span key={t} className="px-2 py-0.5 border rounded text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}
