// src/app/events/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import RSVPForm from '@/components/RSVPForm'
import { fetchEvents } from '@/lib/api'
import type { EventItem } from '@/types'

export const revalidate = 60 // ISR: refresh once a minute

export async function generateMetadata({ params }: { params: { id: string } }) {
  const events = (await fetchEvents().catch(() => [])) as EventItem[]
  const awaitedParams = await params
  const ev = (events || []).find(e => String(e.id) === String(awaitedParams.id))
  if (!ev) return { title: 'Event — PCOF' }

  return {
    title: ev.title ?? 'Event — PCOF',
    description: (ev.description ?? '').slice(0, 150) || `Join ${ev.title} hosted by ${ev.host ?? 'PCOF'}`,
    openGraph: {
      title: ev.title ?? 'Event — PCOF',
      description: ev.description ? ev.description.slice(0, 150) : '',
      images: ev.image ? [String(ev.image)] : undefined,
    },
  }
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const events = (await fetchEvents().catch(() => [])) as EventItem[]
  const awaitedParams = await params
  const raw = (events || []).find(e => String(e.id) === String(awaitedParams.id))

  if (!raw) {
    notFound()
  }

  // Normalize & narrow fields to safe local variables
  const id = String(raw!.id)
  const title = typeof raw!.title === 'string' ? raw!.title : 'Untitled Event'
  const host = typeof raw!.host === 'string' ? raw!.host : 'PCOF'
  const description = typeof raw!.description === 'string' ? raw!.description : ''
  const image = raw!.image ? String(raw!.image) : undefined
  const location = typeof raw!.location === 'string' ? raw!.location : undefined
  const locationUrl = raw!.locationUrl ? String(raw!.locationUrl) : undefined
  const online = typeof raw!.online === 'boolean' ? raw!.online : false
  const onlineUrl = raw!.onlineUrl ? String(raw!.onlineUrl) : undefined
  const timezone = typeof raw!.timezone === 'string' ? raw!.timezone : undefined
  const capacity = typeof raw!.capacity === 'number' ? raw!.capacity : undefined
  const contactEmail = raw!.contactEmail ? String(raw!.contactEmail) : undefined
  const contactPhone = raw!.contactPhone ? String(raw!.contactPhone) : undefined
  const tags = Array.isArray(raw!.tags) ? raw!.tags.filter(t => typeof t === 'string') as string[] : []
  const canceled = Boolean(raw!.canceled)

  const starts = raw!.startsAt ? new Date(String(raw!.startsAt)) : null
  const ends = raw!.endsAt ? new Date(String(raw!.endsAt)) : null
  const startLabel = starts ? starts.toLocaleString() : 'TBD'
  const endLabel = ends ? ends.toLocaleString() : null

  // JSON-LD for SEO / rich results (defensive)
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    startDate: raw!.startsAt ?? undefined,
    endDate: raw!.endsAt ?? undefined,
    description: description ?? '',
    location: locationUrl
      ? {
        '@type': 'Place',
        name: location ?? 'Venue',
        url: locationUrl,
        address: raw!.address ?? undefined,
      }
      : online
        ? { '@type': 'VirtualLocation', url: onlineUrl ?? undefined }
        : undefined,
    organizer: {
      '@type': 'Organization',
      name: host,
    },
    eventStatus: canceled ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: online
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
  }

  // safe href for directions (fallback '#')
  const directionsHref =
    (locationUrl && typeof locationUrl === 'string' && locationUrl) ||
    (location ? `https://www.google.com/maps/search/${encodeURIComponent(location)}` : '#')

  return (
    <article className="py-8">
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2">
          {/* Event Header */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-green-100">
            <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
            <div className="text-sm text-slate-600 mt-2 flex items-center gap-1">
              <span>👤</span> Hosted by {host}
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <span>⏰</span> When
                </div>
                <div className="mt-1 font-medium">
                  {startLabel}
                  {endLabel ? ` — ${endLabel}` : ''}
                </div>
                {timezone && <div className="text-xs text-slate-500 mt-1">({timezone})</div>}
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <span>📍</span> Where
                </div>
                <div className="mt-1 font-medium">{location ?? (online ? 'Online' : 'TBD')}</div>

                {locationUrl && locationUrl !== '#' && (
                  <a
                    className="mt-2 inline-block text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    href={directionsHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>🗺️</span> Directions
                  </a>
                )}

                {online && onlineUrl && (
                  <a
                    className="mt-2 inline-block text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    href={onlineUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>🔗</span> Join online
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Event Image (uses next/image) */}
          {image && (
            <div className="w-full h-64 md:h-80 relative overflow-hidden rounded-2xl mb-6">
              <Image
                src={image}
                alt={title}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={false}
              />
            </div>
          )}

          {/* Event Description */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-green-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-sky-600">📝</span> About This Event
            </h2>
            <div className="text-slate-700 leading-relaxed whitespace-pre-line">
              {description || 'No description provided.'}
            </div>
          </div>

          {/* Calendar Actions */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-green-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-sky-600">📅</span> Add to Calendar
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/api/events/${encodeURIComponent(String(id))}/ics`}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center gap-1"
              >
                <span>📥</span> Download iCal
              </Link>

              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                  title
                )}&dates=${starts ? starts.toISOString().replace(/[-:]|\.\d{3}/g, '') : ''}/${ends ? ends.toISOString().replace(/[-:]|\.\d{3}/g, '') : ''
                  }&details=${encodeURIComponent(description)}`}
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
            <RSVPForm eventId={id} capacity={capacity} />
          </div>

          {/* JSON-LD */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </main>

        <aside className="space-y-6">
          {/* Host Information */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-sky-600">👤</span> Hosted by
            </h3>
            <div className="font-medium">{host}</div>

            {contactEmail && (
              <div className="text-sm mt-3 flex items-center gap-1">
                <span>✉️</span>
                <a className="text-sky-600 hover:text-sky-700" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
              </div>
            )}

            {contactPhone && (
              <div className="text-sm mt-2 flex items-center gap-1">
                <span>📞</span>
                <a className="text-sky-600 hover:text-sky-700" href={`tel:${contactPhone}`}>
                  {contactPhone}
                </a>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-sky-600">❓</span> Need help?
            </h3>
            <div className="text-sm text-slate-700 mb-4">Contact the host or the PCOF office for assistance.</div>
            <Link href="/contact" className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors">
              <span>📧</span> Contact us
            </Link>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-sky-600">🏷️</span> Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
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
