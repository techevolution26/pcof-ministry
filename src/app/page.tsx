// app/page.tsx
import Link from 'next/link'
import SubscribeForm from '../components/SubscribeForm'
import { fetchChurches, fetchSermons, fetchEvents } from '../lib/api'

// ISR: still static but revalidates every hour (change as you need)
export const revalidate = 3600

// To switch to full server-side rendering for this page, uncomment:
// export const dynamic = 'force-dynamic'

export default async function Home() {
  // server-side data reads from public JSON (or DB later)
  const [churches, sermons, events] = await Promise.all([
    fetchChurches(),
    fetchSermons(),
    fetchEvents(),
  ])

  // compute a few friendly things
  const totalChurches = Array.isArray(churches) ? churches.length : 0
  const totalSermons = Array.isArray(sermons) ? sermons.length : 0

  // pick next upcoming event (future) or first event
  const upcoming = (Array.isArray(events) ? events : [])
    .map((e: any) => ({ ...e, startsAt: new Date(e.startsAt) }))
    .filter((e: any) => e.startsAt > new Date())
    .sort((a: any, b: any) => a.startsAt - b.startsAt)[0] ?? events?.[0]

  const featuredSermons = (Array.isArray(sermons) ? sermons : []).slice(0, 3)

  return (
    <section>
      {/* HERO */}
      <header className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white rounded-lg p-8 mb-8">
        <div className="container mx-auto flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Pentecostal Church One Faith Ministry— PCOF
            </h1>
            <p className="mt-4 text-lg max-w-2xl">
              We gather in Compassion, Love & Service. Join a local fellowship, watch a sermon, or partner with us to serve the community.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/churches" className="inline-block px-4 py-2 bg-white text-sky-700 rounded shadow font-medium">
                Find a Church
              </Link>

              <Link href="/donate" className="inline-block px-4 py-2 border border-white/40 text-white rounded font-medium hover:bg-white/10">
                Give / Support
              </Link>
            </div>
          </div>

          <div className="w-full md:w-72 bg-white/10 p-4 rounded">
            <div className="text-sm text-white/90">Next Meeting</div>
            {upcoming ? (
              <div className="mt-2">
                <div className="font-semibold text-white">{upcoming.title}</div>
                <div className="text-xs text-white/90">{new Date(upcoming.startsAt).toLocaleString()}</div>
                {upcoming.location && <div className="text-xs text-white/80 mt-1">{upcoming.location}</div>}
                <Link href={`/events`} className="mt-3 inline-block text-sm underline text-white/90">View event</Link>
              </div>
            ) : (
              <div className="mt-2 text-sm text-white/80">No upcoming events yet — check back soon.</div>
            )}
          </div>
        </div>
      </header>

      {/* STATS */}
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Churches</div>
          <div className="text-2xl font-semibold">{totalChurches}</div>
          <p className="text-sm mt-2">Local congregations connected under PCOF.</p>
        </div>

        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Upcoming Events & Programs</div>
          <div className="text-2xl font-semibold">{totalSermons}</div>
          <p className="text-sm mt-2">Participate in Spiritual building programs.</p>
        </div>

        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Volunteers</div>
          <div className="text-2xl font-semibold">—</div>
          <p className="text-sm mt-2">Volunteer programs and outreach opportunities.</p>
        </div>
      </div>

      {/* FEATURED SERMONS */}
      <section className="container mx-auto mb-8">
        <h2 className="text-xl font-bold mb-4">Latest Sermons</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredSermons.length === 0 && <div className="p-4 border rounded">No sermons published yet.</div>}
          {featuredSermons.map((s: any) => (
            <article key={s.id} className="p-4 border rounded">
              <h3 className="font-semibold">{s.title}</h3>
              <div className="text-sm text-gray-600">{s.speaker} — {new Date(s.date).toLocaleDateString()}</div>
              <p className="text-sm mt-2 line-clamp-3">{s.summary ?? ''}</p>
              <div className="mt-3 flex gap-2">
                <Link href={`/sermons/${s.id}`} className="text-sm underline">View</Link>
                {s.mediaUrl ? <a href={s.mediaUrl} className="text-sm underline">Play</a> : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CHURCH LOCATIONS SNAPSHOT */}
      <section className="container mx-auto mb-8">
        <h2 className="text-xl font-bold mb-4">Our Churches</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(Array.isArray(churches) ? churches : []).slice(0, 6).map((c: any) => (
            <div key={c.id} className="p-4 border rounded">
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-gray-600">{c.address}</div>
              <div className="text-sm text-gray-500 mt-2">Pastor: {c.pastor ?? '—'}</div>
              <Link href={`/churches/${c.slug ?? c.id}`} className="mt-3 inline-block text-sm underline">Visit</Link>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/churches" className="text-sm underline">View all churches</Link>
        </div>
      </section>

      {/* NEWSLETTER / SUBSCRIBE (client) */}
      <section className="container mx-auto mb-12">
        <h2 className="text-xl font-bold mb-3">Stay updated</h2>
        <p className="text-sm text-gray-600 mb-3">Subscribe for weekly updates and event reminders.</p>
        <SubscribeForm />
      </section>
    </section>
  )
}