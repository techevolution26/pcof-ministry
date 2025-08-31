// app/churches/[slug]/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { fetchChurches, fetchSermons, fetchEvents } from '@/lib/api'

export const revalidate = 60 // ISR: refresh every minute

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
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

  const allSermons = (await fetchSermons()) || []
  const allEvents = (await fetchEvents()) || []

  const sermons = allSermons.filter((s: any) =>
    s.churchId === church.id || s.churchSlug === church.slug || (s.church && (s.church === church.name))
  )

  const upcomingEvents = allEvents
    .map((e: any) => ({ ...e, startsAt: e.startsAt ? new Date(e.startsAt) : null }))
    .filter((e: any) => {
      if (e.churchId && e.churchId === church.id) return true
      if (e.churchSlug && e.churchSlug === church.slug) return true
      if (e.church && e.church === church.name) return true
      return false
    })
    .filter((e: any) => !e.startsAt || e.startsAt > new Date())
    .sort((a: any, b: any) => (a.startsAt ? a.startsAt.getTime() : 0) - (b.startsAt ? b.startsAt.getTime() : 0))

  const initials = (church.name || '').split(' ').map((s: string) => s[0]).slice(0, 2).join('')

  return (
    <article className="py-8">
      <div className="container mx-auto px-4">
        {/* Hero / header */}
        <section className="bg-white rounded-2xl shadow-md p-8 mb-8 flex flex-col md:flex-row gap-8 items-start border border-green-100">
          <div className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden bg-sky-100 flex items-center justify-center">
            {church.logoUrl ? (
              <Image src={church.logoUrl} alt={`${church.name} logo`} width={128} height={128} style={{ objectFit: 'cover' }} />
            ) : (
              <div className="text-3xl font-bold text-sky-600">{initials}</div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-800">{church.name}</h1>
            {church.tagline && <p className="text-slate-600 mt-2 text-lg">{church.tagline}</p>}

            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <Link href={`/churches/${church.slug}/about`} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center gap-1">
                <span>ℹ️</span> About
              </Link>
              <Link href={`/churches/${church.slug}/ministries`} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center gap-1">
                <span>👥</span> Ministries
              </Link>
              <Link href={`/churches/${church.slug}/sermons`} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center gap-1">
                <span>📖</span> Sermons
              </Link>
              <Link href={`/donate?church=${church.slug}`} className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors flex items-center gap-1">
                <span>💝</span> Give
              </Link>
              <a
                href={church.locationUrl ?? (church.address ? `https://www.google.com/maps/search/${encodeURIComponent(church.address)}` : '#')}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center gap-1"
              >
                <span>🗺️</span> Directions
              </a>
            </div>

            <div className="mt-6 text-sm text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <span>👨‍💼</span> Pastor
                </div>
                <div className="font-medium mt-1">{church.pastor ?? '—'}</div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <span>📍</span> Location
                </div>
                <div className="font-medium mt-1">{church.address ?? '—'}</div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <span>⏰</span> Service Times
                </div>
                <div className="font-medium mt-1">{church.serviceTimes ?? 'See events'}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Main grid: About / Events / Sermons / Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <section className="bg-white p-6 rounded-2xl shadow-md border border-green-100">
              <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                <span className="text-sky-600">ℹ️</span> About {church.name}
              </h2>
              <p className="text-slate-700 leading-relaxed">{church.description ?? 'No description yet.'}</p>
            </section>

            {/* Upcoming Events */}
            <section className="bg-white p-6 rounded-2xl shadow-md border border-green-100">
              <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                <span className="text-sky-600">📅</span> Upcoming Events
              </h2>
              {upcomingEvents.length === 0 ? (
                <div className="text-slate-600 bg-green-50 p-4 rounded-lg">No upcoming events listed.</div>
              ) : (
                <ul className="space-y-4">
                  {upcomingEvents.slice(0, 6).map((e: any) => (
                    <li key={e.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-lg">{e.title}</div>
                          {e.location && (
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                              <span>📍</span> {e.location}
                            </div>
                          )}
                          {e.startsAt && (
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                              <span>⏰</span> {new Date(e.startsAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="text-sm">
                          <Link href={`/events/${e.id}`} className="text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
                            <span>👁️</span> View
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recent Sermons */}
            <section className="bg-white p-6 rounded-2xl shadow-md border border-green-100">
              <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                <span className="text-sky-600">📖</span> Recent Sermons
              </h2>
              {sermons.length === 0 ? (
                <div className="text-slate-600 bg-green-50 p-4 rounded-lg">No sermons linked to this church yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sermons.slice(0, 6).map((s: any) => (
                    <article key={s.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow flex flex-col">
                      <div className="font-semibold text-lg">{s.title}</div>
                      <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <span>🎤</span> {s.speaker ?? ''} — {s.date ? new Date(s.date).toLocaleDateString() : ''}
                      </div>
                      <div className="mt-3 text-sm text-slate-700 line-clamp-3">{s.summary ?? ''}</div>
                      <div className="mt-4 flex gap-3">
                        <Link href={`/sermons/${s.id}`} className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
                          <span>👁️</span> View
                        </Link>
                        {s.mediaUrl && (
                          <a href={s.mediaUrl} target="_blank" rel="noreferrer" className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1">
                            <span>▶️</span> Play
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column: Contact / Quick actions */}
          <aside className="space-y-8">
            <section className="bg-white p-6 rounded-2xl shadow-md border border-green-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-sky-600">📞</span> Contact
              </h3>
              <div className="text-slate-700 space-y-3">
                {church.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <a href={`tel:${church.phone}`} className="underline hover:text-sky-600">{church.phone}</a>
                  </div>
                )}
                {church.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✉️</span>
                    <a href={`mailto:${church.email}`} className="underline hover:text-sky-600">{church.email}</a>
                  </div>
                )}
                {church.website && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌐</span>
                    <a href={church.website} target="_blank" rel="noreferrer" className="underline hover:text-sky-600">Visit Website</a>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-green-100">
                  <Link href={`/churches/${church.slug}/contact`} className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors">
                    <span>✉️</span> Send a message
                  </Link>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-md border border-green-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-sky-600">🤝</span> Get Involved
              </h3>
              <div className="text-slate-700 mb-4">Interested in volunteering or joining a ministry? Contact the church leadership to learn how to get involved.</div>
              <div className="mt-3">
                <Link href={`/churches/${church.slug}/volunteer`} className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors">
                  <span>👥</span> Volunteer
                </Link>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-md border border-green-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-sky-600">⚡</span> Quick Actions
              </h3>
              <div className="space-y-3">
                <Link href={`/donate?church=${church.slug}`} className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors">
                  <span>💝</span> Give to this church
                </Link>
                <Link href={`/churches/${church.slug}/ministries`} className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors">
                  <span>👥</span> See ministries
                </Link>
                <Link href={`/churches/${church.slug}/events`} className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors">
                  <span>📅</span> All events
                </Link>
              </div>
            </section>
          </aside>
        </div>

        {/* Footer small: admin / edit (placeholder) */}
        <div className="mt-12 p-4 bg-white rounded-2xl shadow-md border border-green-100 text-center">
          <div className="text-sm text-slate-600">
            Need to update this page? Church leaders can <Link href="/admin" className="text-sky-600 hover:text-sky-700 underline">request access</Link> to manage their microsite.
          </div>
        </div>
      </div>
    </article>
  )
}