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
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2">
          {/* Event Header */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-green-100">
            <h1 className="text-3xl font-bold text-slate-800">{event.title}</h1>
            <div className="text-sm text-slate-600 mt-2 flex items-center gap-1">
              <span>👤</span> Hosted by {event.host ?? 'PCOF'}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <span>⏰</span> When
                </div>
                <div className="mt-1 font-medium">
                  {startLabel}{endLabel ? ` — ${endLabel}` : ''}
                </div>
                {event.timezone && (
                  <div className="text-xs text-slate-500 mt-1">({event.timezone})</div>
                )}
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <span>📍</span> Where
                </div>
                <div className="mt-1 font-medium">
                  {event.location ? event.location : (event.online ? 'Online' : 'TBD')}
                </div>
                {event.locationUrl && (
                  <a className="mt-2 inline-block text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1" href={event.locationUrl} target="_blank" rel="noreferrer">
                    <span>🗺️</span> Directions
                  </a>
                )}
                {event.online && event.onlineUrl && (
                  <a className="mt-2 inline-block text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1" href={event.onlineUrl} target="_blank" rel="noreferrer">
                    <span>🔗</span> Join online
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Event Image */}
          {event.image && (
            <div className="w-full h-64 md:h-80 relative overflow-hidden rounded-2xl mb-6">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Event Description */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-green-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-sky-600">📝</span> About This Event
            </h2>
            <div className="text-slate-700 leading-relaxed whitespace-pre-line">
              {event.description ?? 'No description provided.'}
            </div>
          </div>

          {/* Calendar Actions */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-green-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-sky-600">📅</span> Add to Calendar
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/api/events/${event.id}/ics`}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center gap-1"
              >
                <span>📥</span> Download iCal
              </Link>

              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title || '')}&dates=${starts ? starts.toISOString().replace(/[-:]|\.\d{3}/g, '') : ''}/${ends ? ends.toISOString().replace(/[-:]|\.\d{3}/g, '') : ''}&details=${encodeURIComponent(event.description || '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center gap-1"
              >
                <span>📆</span> Add to Google Calendar
              </a>

              <Link
                href="/events"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center gap-1"
              >
                <span>⬅️</span> Back to events
              </Link>
            </div>
          </div>

          {/* RSVP Section */}
          <div id="rsvp" className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-sky-600">✅</span> Register / RSVP
            </h2>
            <RSVPForm eventId={event.id} capacity={event.capacity} />
          </div>

          {/* JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </main>

        <aside className="space-y-6">
          {/* Host Information */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-sky-600">👤</span> Hosted by
            </h3>
            <div className="font-medium">{event.host ?? 'PCOF'}</div>
            {event.contactEmail && (
              <div className="text-sm mt-3 flex items-center gap-1">
                <span>✉️</span>
                <a className="text-sky-600 hover:text-sky-700" href={`mailto:${event.contactEmail}`}>
                  {event.contactEmail}
                </a>
              </div>
            )}
            {event.contactPhone && (
              <div className="text-sm mt-2 flex items-center gap-1">
                <span>📞</span>
                <a className="text-sky-600 hover:text-sky-700" href={`tel:${event.contactPhone}`}>
                  {event.contactPhone}
                </a>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-sky-600">❓</span> Need help?
            </h3>
            <div className="text-sm text-slate-700 mb-4">
              Contact the host or the PCOF office for assistance.
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors"
            >
              <span>📧</span> Contact us
            </Link>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-sky-600">🏷️</span> Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((t: string) => (
                  <span key={t} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}