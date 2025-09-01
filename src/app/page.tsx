// src/app/page.tsx
import Link from 'next/link'
import SubscribeForm from '../components/SubscribeForm'
import { fetchChurches, fetchSermons, fetchEvents } from '../lib/api'
import type { EventItem, Sermon, Church } from '@/types'

export const revalidate = 3600 // ISR: still static but revalidates every hour

function toDateOrNull(value: unknown): Date | null {
  if (value == null) return null
  const d = new Date(String(value))
  return isNaN(d.getTime()) ? null : d
}

function normalizeEvent(raw: unknown): EventItem | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>

  const idCandidate = obj.id ?? obj._id ?? obj.uid ?? obj.slug
  const id = idCandidate != null ? String(idCandidate) : ''
  if (!id) return null

  const title = obj.title ?? obj.name ?? 'Untitled Event'
  const description = typeof obj.description === 'string' ? obj.description : undefined
  const imageUrl = typeof (obj.imageUrl ?? obj.image ?? obj.thumbnail) === 'string'
    ? String(obj.imageUrl ?? obj.image ?? obj.thumbnail)
    : undefined
  const slug = typeof obj.slug === 'string' ? obj.slug : undefined
  const location = typeof (obj.location ?? obj.venue) === 'string'
    ? String(obj.location ?? obj.venue)
    : undefined

  // if you have a helper `toDateOrNull`, use it; otherwise parse directly
  const startsDate = obj.startsAt ? new Date(String(obj.startsAt)) : null
  const endsDate = obj.endsAt ? new Date(String(obj.endsAt)) : null
  const startsAt = startsDate && !isNaN(startsDate.getTime()) ? startsDate.toISOString() : undefined
  const endsAt = endsDate && !isNaN(endsDate.getTime()) ? endsDate.toISOString() : undefined

  return {
    id: String(id),
    title: String(title),
    slug,
    description,
    imageUrl,
    location,
    startsAt,
    endsAt,
  }
}


function normalizeSermon(raw: unknown): Sermon | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const idCandidate = obj.id ?? obj._id ?? obj.uid
  const id = idCandidate != null ? String(idCandidate) : ''
  if (!id) return null
  return {
    id,
    title: typeof obj.title === 'string' ? obj.title : String(obj.title ?? 'Untitled Sermon'),
    speaker: typeof obj.speaker === 'string' ? obj.speaker : undefined,
    date: typeof obj.date === 'string' ? obj.date : typeof obj.date === 'number' ? new Date(obj.date).toISOString() : undefined,
    summary: typeof obj.summary === 'string' ? obj.summary : undefined,
    mediaUrl: typeof obj.mediaUrl === 'string' ? obj.mediaUrl : undefined,
  }
}

function normalizeChurch(raw: unknown): Church | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const idCandidate = obj.id ?? obj._id ?? obj.uid
  const id = idCandidate != null ? String(idCandidate) : ''
  if (!id) return null
  return {
    id,
    name: typeof obj.name === 'string' ? obj.name : 'Unnamed Church',
    slug: typeof obj.slug === 'string' ? obj.slug : undefined,
    address: typeof obj.address === 'string' ? obj.address : undefined,
    pastor: typeof obj.pastor === 'string' ? obj.pastor : undefined,
  }
}

export default async function Home() {
  // fetches may return unknown shapes; handle defensively
  const [rawChurches, rawSermons, rawEvents] = await Promise.all([
    fetchChurches().catch(() => []),
    fetchSermons().catch(() => []),
    fetchEvents().catch(() => []),
  ] as unknown[])

  const churches: Church[] = Array.isArray(rawChurches)
    ? rawChurches.map(normalizeChurch).filter((c): c is Church => c !== null)
    : []

  const sermons: Sermon[] = Array.isArray(rawSermons)
    ? rawSermons.map(normalizeSermon).filter((s): s is Sermon => s !== null)
    : []

  const eventsNormalized: EventItem[] = Array.isArray(rawEvents)
    ? rawEvents.map(normalizeEvent).filter((ev): ev is EventItem => ev !== null)
    : []

  const totalChurches = churches.length
  // totalSermons is not used in UI currently; keep computed if needed later
  const totalSermons = sermons.length

  // find upcoming event: startsAt must be a Date and in the future
  const now = Date.now()

  // convert each event's startsAt to a Date for sorting/filtering (but keep the original array)
  const futureEvents = eventsNormalized
    .map(ev => ({
      ev,
      startsAtDate: toDateOrNull(ev.startsAt)
    }))
    // keep only those with a valid Date in the future
    .filter(({ startsAtDate }) => startsAtDate !== null && startsAtDate.getTime() > now)

  // pick the earliest future event (if any)
  const upcoming = futureEvents.length > 0
    ? // sort by the Date value
    futureEvents.sort((a, b) => (a.startsAtDate!.getTime() - b.startsAtDate!.getTime()))[0].ev
    : // fallback to the first event in the normalized list (or null)
    eventsNormalized[0] ?? null

  const featuredSermons = sermons.slice(0, 3)

  return (
    <section>
      {/* HERO */}
      <header className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white rounded-2xl p-8 mb-8 shadow-lg">
        <div className="container mx-auto flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Pentecostal Church One Faith Ministry— PCOF
            </h1>
            <p className="mt-4 text-lg max-w-2xl">
              We gather in Compassion, Love &amp; Service. Join a local fellowship, watch a sermons, or partner with us to serve the community.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/churches" className="inline-block px-4 py-2 bg-white text-sky-700 rounded-full shadow-md font-medium transition-transform hover:-translate-y-0.5">
                Find a Church
              </Link>

              <Link href="/donate" className="inline-block px-4 py-2 border-2 border-white/40 text-white rounded-full font-medium hover:bg-white/10 transition-all">
                Give / Support
              </Link>
            </div>
          </div>

          <div className="w-full md:w-80 bg-white/20 p-6 rounded-2xl backdrop-blur-sm border border-white/30 shadow-md">
            <div className="text-sm text-white/90 font-semibold flex items-center gap-2">
              <span className="text-lg">📅</span> Next Event
            </div>
            {upcoming ? (
              <div className="mt-3">
                <div className="font-bold text-white text-lg">{upcoming.title}</div>
                <div className="text-sm text-white/90 mt-1 flex items-center gap-1">

                  <span>⏰</span> {upcoming.startsAt ? upcoming.startsAt.toLocaleString() : 'TBD'}
                </div>
                {upcoming.location && (
                  <div className="text-sm text-white/80 mt-2 flex items-center gap-1">
                    <span>📍</span> {upcoming.location}
                  </div>
                )}
                <Link href={`/events`} className="mt-4 inline-block text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors">
                  View Event Details
                </Link>
              </div>
            ) : (
              <div className="mt-2 text-sm text-white/80">No upcoming events yet — check back soon.</div>
            )}
          </div>
        </div>
      </header>

      {/* STATS */}
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
          <div className="text-sm text-gray-500 mb-2">🏛️ Churches</div>
          <div className="text-3xl font-bold text-sky-700">{totalChurches}</div>
          <p className="text-sm mt-3 text-gray-600">Local congregations connected under PCOF.</p>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
          <div className="text-sm text-gray-500 mb-2">📅 Upcoming Events &amp; Programs</div>
          <div className="text-3xl font-bold text-sky-700">{eventsNormalized.length}</div>
          <p className="text-sm mt-3 text-gray-600">Participate in Spiritual building programs.</p>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-md border border-green-100 hover:shadow-lg transition-shadow">
          <div className="text-sm text-gray-500 mb-2">👥 Volunteers</div>
          <div className="text-3xl font-bold text-sky-700">—</div>
          <p className="text-sm mt-3 text-gray-600">Volunteer programs and outreach opportunities.</p>
        </div>
      </div>

      {/* FEATURED SERMONS */}
      <section className="container mx-auto mb-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <span className="text-sky-600">📖</span> Latest Sermons
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredSermons.length === 0 && (
            <div className="p-6 bg-white rounded-2xl shadow-md border border-green-100 col-span-3 text-center">
              No sermons published yet.
            </div>
          )}
          {featuredSermons.map((s) => {
            const sermonDate = toDateOrNull(s.date)
            return (
              <article key={s.id} className="bg-white rounded-2xl shadow-md p-5 border border-green-100 hover:shadow-lg transition-all duration-300">
                <h3 className="font-bold text-lg text-slate-800">{s.title}</h3>
                <div className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                  <span>🎤</span> {s.speaker ?? 'PCOF'} — {sermonDate ? sermonDate.toLocaleDateString() : 'TBD'}
                </div>
                <p className="text-sm mt-3 text-gray-700 line-clamp-3">{s.summary ?? ''}</p>
                <div className="mt-4 flex gap-3">
                  <Link href={`/sermons/${s.id}`} className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
                    <span>👁️</span> View
                  </Link>
                  {s.mediaUrl && (
                    <a href={s.mediaUrl} className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
                      <span>▶️</span> Play
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* CHURCH LOCATIONS SNAPSHOT */}
      <section className="container mx-auto mb-8">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-2">
          <span className="text-sky-600">⛪</span> Our Churches
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {churches.slice(0, 6).map((c) => (
            <div key={c.id} className="bg-white rounded-2xl shadow-md p-5 border border-green-100 hover:shadow-lg transition-all duration-300">
              <div className="font-bold text-slate-800 text-lg">{c.name ?? '—'}</div>
              <div className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                <span>📍</span> {c.address ?? '—'}
              </div>
              <div className="text-sm text-gray-500 mt-3 flex items-center gap-1">
                <span>👨‍💼</span> Pastor: {c.pastor ?? '—'}
              </div>
              <Link href={`/churches/${c.slug ?? c.id}`} className="mt-4 inline-block text-sm text-sky-600 hover:text-sky-700 font-medium">
                Visit Church Page
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link href="/churches" className="inline-flex items-center gap-2 px-5 py-2 bg-sky-600 text-white rounded-full font-medium shadow-md hover:bg-sky-700 transition-colors">
            <span>🔍</span> View all churches
          </Link>
        </div>
      </section>

      {/* NEWSLETTER / SUBSCRIBE (client) */}
      <section className="container mx-auto mb-12">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
          <h2 className="text-2xl font-bold mb-3 text-slate-800 flex items-center gap-2">
            <span className="text-sky-600">✉️</span> Stay updated
          </h2>
          <p className="text-sm text-gray-600 mb-4">Subscribe for weekly updates and event reminders.</p>
          <SubscribeForm />
        </div>
      </section>
    </section>
  )
}
