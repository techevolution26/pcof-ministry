// app/churches/[slug]/page.tsx
// Detailed church microsite template (Server Component)
// - Static-first (ISR) ready; switch to SSR with `export const dynamic = 'force-dynamic'` when you connect a DB
// - Reads from `lib/api` helpers (currently reads public JSON). When you add Prisma, replace those calls with DB queries.

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { fetchChurches, fetchSermons, fetchEvents } from '@/lib/api'

export const revalidate = 60 // ISR: refresh every minute
// export const dynamic = 'force-dynamic' // enable for live data from DB

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  // lightweight metadata generation using the static JSON data
  const all = await fetchChurches()
  const awaitedParams = await params
  const church = (all || []).find((c: any) => c.slug === awaitedParams.slug || c.id === awaitedParams.slug)
  if (!church) return { title: 'Church — PCOF' }

  return {
    title: `${church.name} — PCOF`,
    description: church.description || `Join ${church.name} — find service times, location, leaders and latest sermons.`,
    openGraph: {
      title: `${church.name} — PCOF`,
      description: church.description || '',
      images: church.logoUrl ? [church.logoUrl] : undefined,
    }
  }
}

export default async function ChurchPage({ params }: Props) {
  const { slug } = await params
  const churches = (await fetchChurches()) || []
  const church = churches.find((c: any) => c.slug === slug || c.id === slug)

  if (!church) {
    notFound()
  }

  // Load related content (sermons/events) and try to associate by church id/slug/name.
  const allSermons = (await fetchSermons()) || []
  const allEvents = (await fetchEvents()) || []

  // Best-effort filtering: prefer explicit churchId or churchSlug fields; fallback to name match.
  const sermons = allSermons.filter((s: any) =>
    s.churchId === church.id || s.churchSlug === church.slug || (s.church && (s.church === church.name))
  )

  const upcomingEvents = allEvents
    .map((e: any) => ({ ...e, startsAt: e.startsAt ? new Date(e.startsAt) : null }))
    .filter((e: any) => {
      // filter by explicit church relation or fallback to name match
      if (e.churchId && e.churchId === church.id) return true
      if (e.churchSlug && e.churchSlug === church.slug) return true
      if (e.church && e.church === church.name) return true
      // else if event has no church marker, don't include
      return false
    })
    .filter((e: any) => !e.startsAt || e.startsAt > new Date())
    .sort((a: any, b: any) => (a.startsAt ? a.startsAt.getTime() : 0) - (b.startsAt ? b.startsAt.getTime() : 0))

  // small helper for initials
  const initials = (church.name || '').split(' ').map((s: string) => s[0]).slice(0, 2).join('')

  return (
    <article className="py-8">
      <div className="container mx-auto">
        {/* Hero / header */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8 flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0 w-28 h-28 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
            {church.logoUrl ? (
              <Image src={church.logoUrl} alt={`${church.name} logo`} width={112} height={112} style={{ objectFit: 'cover' }} />
            ) : (
              <div className="text-2xl font-bold text-slate-700">{initials}</div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold">{church.name}</h1>
            {church.tagline && <p className="text-slate-600 mt-1">{church.tagline}</p>}

            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <Link href={`/churches/${church.slug}/about`} className="px-3 py-1 border rounded text-sm">About</Link>
              <Link href={`/churches/${church.slug}/ministries`} className="px-3 py-1 border rounded text-sm">Ministries</Link>
              <Link href={`/churches/${church.slug}/sermons`} className="px-3 py-1 border rounded text-sm">Sermons</Link>
              <Link href={`/donate?church=${church.slug}`} className="px-3 py-1 bg-sky-600 text-white rounded text-sm">Give</Link>
              <a
                href={church.locationUrl ?? (church.address ? `https://www.google.com/maps/search/${encodeURIComponent(church.address)}` : '#')}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 border rounded text-sm"
              >
                Directions
              </a>
            </div>

            <div className="mt-4 text-sm text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-slate-500">Pastor</div>
                <div className="font-medium">{church.pastor ?? '—'}</div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Location</div>
                <div className="font-medium">{church.address ?? '—'}</div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Service Times</div>
                <div className="font-medium">{church.serviceTimes ?? 'See events'}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Main grid: About / Events / Sermons / Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <section className="bg-white p-4 rounded border">
              <h2 className="text-lg font-semibold mb-2">About {church.name}</h2>
              <p className="text-sm text-slate-700">{church.description ?? 'No description yet.'}</p>
            </section>

            {/* Upcoming Events */}
            <section className="bg-white p-4 rounded border">
              <h2 className="text-lg font-semibold mb-2">Upcoming Events</h2>
              {upcomingEvents.length === 0 ? (
                <div className="text-sm text-slate-600">No upcoming events listed.</div>
              ) : (
                <ul className="space-y-3">
                  {upcomingEvents.slice(0, 6).map((e: any) => (
                    <li key={e.id} className="p-3 border rounded">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{e.title}</div>
                          <div className="text-xs text-slate-500">{e.location ?? ''}</div>
                          <div className="text-xs text-slate-500 mt-1">{e.startsAt ? new Date(e.startsAt).toLocaleString() : ''}</div>
                        </div>
                        <div className="text-sm">
                          <Link href={`/events/${e.id}`} className="underline">View</Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recent Sermons */}
            <section className="bg-white p-4 rounded border">
              <h2 className="text-lg font-semibold mb-2">Recent Sermons</h2>
              {sermons.length === 0 ? (
                <div className="text-sm text-slate-600">No sermons linked to this church yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sermons.slice(0, 6).map((s: any) => (
                    <article key={s.id} className="p-3 border rounded flex flex-col">
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-xs text-slate-500">{s.speaker ?? ''} — {s.date ? new Date(s.date).toLocaleDateString() : ''}</div>
                      <div className="mt-2 text-sm text-slate-700">{s.summary ?? ''}</div>
                      <div className="mt-3">
                        <div className="flex gap-2">
                          <Link href={`/sermons/${s.id}`} className="text-sm underline">View</Link>
                          {s.mediaUrl ? <a href={s.mediaUrl} target="_blank" rel="noreferrer" className="text-sm underline">Play</a> : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column: Contact / Quick actions */}
          <aside className="space-y-6">
            <section className="bg-white p-4 rounded border">
              <h3 className="text-md font-semibold">Contact</h3>
              <div className="text-sm text-slate-700 mt-2">
                {church.phone && (
                  <div className="mb-1">Phone: <a href={`tel:${church.phone}`} className="underline">{church.phone}</a></div>
                )}
                {church.email && (
                  <div className="mb-1">Email: <a href={`mailto:${church.email}`} className="underline">{church.email}</a></div>
                )}
                {church.website && (
                  <div className="mb-1">Website: <a href={church.website} target="_blank" rel="noreferrer" className="underline">Visit</a></div>
                )}

                <div className="mt-2">
                  <Link href={`/churches/${church.slug}/contact`} className="text-sm inline-block underline">Send a message</Link>
                </div>
              </div>
            </section>

            <section className="bg-white p-4 rounded border">
              <h3 className="text-md font-semibold">Get Involved</h3>
              <div className="mt-2 text-sm text-slate-700">Interested in volunteering or joining a ministry? Contact the church leadership to learn how to get involved.</div>
              <div className="mt-3">
                <Link href={`/churches/${church.slug}/volunteer`} className="inline-block px-3 py-2 bg-sky-600 text-white rounded">Volunteer</Link>
              </div>
            </section>

            <section className="bg-white p-4 rounded border">
              <h3 className="text-md font-semibold">Quick Actions</h3>
              <div className="mt-2 flex flex-col gap-2">
                <Link href={`/donate?church=${church.slug}`} className="px-3 py-2 bg-emerald-600 text-white rounded text-center">Give to this church</Link>
                <Link href={`/churches/${church.slug}/ministries`} className="px-3 py-2 border rounded text-center">See ministries</Link>
                <Link href={`/churches/${church.slug}/events`} className="px-3 py-2 border rounded text-center">All events</Link>
              </div>
            </section>
          </aside>
        </div>

        {/* Footer small: admin / edit (placeholder) */}
        <div className="mt-8 text-sm text-slate-500">
          <div>Need to update this page? Church leaders can <Link href="/admin" className="underline">request access</Link> to manage their microsite.</div>
        </div>
      </div>
    </article>
  )
}

/*
Notes / migration tips:
- When you add a database (Prisma + Postgres) replace fetchChurches/fetchSermons/fetchEvents with targeted queries such as `prisma.church.findUnique({ where: { slug } })` and eager-load related sermons/events.
- For better SEO/OpenGraph use a proper image URL (host on Cloudinary or your CDN) and include `og:image` in generateMetadata.
- Consider caching strategies: keep ISR for this page but reduce revalidate time for active churches.
- Add server-side permission checks for admin edit links (do not rely on client checks).
*/
