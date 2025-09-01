// src/app/admin/dashboard-ui.tsx
import Link from 'next/link'
import Image from 'next/image'
import { fetchChurches, fetchSermons, fetchEvents } from '@/lib/api'

export const revalidate = 60

// local minimal types for admin dashboard usage
type Church = {
  id: string
  name: string
  address?: string
  pastor?: string
  logoUrl?: string
  [key: string]: unknown
}

type Sermon = {
  id: string
  title?: string
  date?: string
  [key: string]: unknown
}

type EventItem = {
  id: string
  title?: string
  startsAt?: string
  [key: string]: unknown
}

type Audit = {
  id: string
  action?: string
  resource?: string
  createdAt?: string
  [key: string]: unknown
}

export default async function AdminDashboardUI() {
  // fetch typed lists (fall back to empty arrays)
  const churches = (await fetchChurches().catch(() => [])) as Church[]
  const sermons = (await fetchSermons().catch(() => [])) as Sermon[]
  const events = (await fetchEvents().catch(() => [])) as EventItem[]

  // read optional audit log (dev-only JSON)
  let audits: Audit[] = []
  try {
    const res = await fetch('/data/audit.json')
    if (res.ok) {
      const json = await res.json().catch(() => [])
      if (Array.isArray(json)) audits = json as Audit[]
    }
  } catch {
    audits = []
  }

  const totalChurches = Array.isArray(churches) ? churches.length : 0
  const totalSermons = Array.isArray(sermons) ? sermons.length : 0
  const totalEvents = Array.isArray(events) ? events.length : 0

  const recentChurches = (Array.isArray(churches) ? churches : []).slice(0, 6)
  const recentAudits = (Array.isArray(audits) ? audits : []).slice(0, 8)

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Overview of recent activity and quick actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/churches/new"
            className="px-4 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition-colors flex items-center gap-1"
          >
            <span>➕</span> Create Church
          </Link>
          <Link
            href="/admin/churches"
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center gap-1"
          >
            <span>🏢</span> Manage Churches
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
          <div className="text-sm text-slate-500 mb-2 flex items-center gap-1">
            <span>⛪</span> Churches
          </div>
          <div className="text-3xl font-bold text-sky-700">{totalChurches}</div>
          <div className="text-xs text-slate-500 mt-2">Active churches in the network</div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
          <div className="text-sm text-slate-500 mb-2 flex items-center gap-1">
            <span>📖</span> Sermons
          </div>
          <div className="text-3xl font-bold text-sky-700">{totalSermons}</div>
          <div className="text-xs text-slate-500 mt-2">Published teachings</div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
          <div className="text-sm text-slate-500 mb-2 flex items-center gap-1">
            <span>📅</span> Upcoming Events
          </div>
          <div className="text-3xl font-bold text-sky-700">{totalEvents}</div>
          <div className="text-xs text-slate-500 mt-2">Events scheduled across churches</div>
        </div>
      </section>

      {/* Quick analytics row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-5 border border-green-100">
          <h3 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-sky-600">🏢</span> Recent Churches
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentChurches.map((c: Church) => {
              // guard: ensure required fields exist
              const name = c.name ?? '—'
              const address = typeof c.address === 'string' ? c.address : '—'
              return (
                <div
                  key={c.id}
                  className="p-4 border border-gray-200 rounded-lg flex gap-4 items-center hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-sky-100 flex items-center justify-center text-sm text-sky-600 font-medium flex-shrink-0">
                    {c.logoUrl ? (
                      // Next/Image is recommended; keep alt text
                      <Image src={String(c.logoUrl)} alt={name} width={48} height={48} style={{ objectFit: 'cover' }} />
                    ) : (
                      <span>{String(name).split(' ').map(s => (s ? s[0] : '')).slice(0, 2).join('')}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{name}</div>
                    <div className="text-xs text-slate-500">{address}</div>
                  </div>
                  <div>
                    <Link href={`/admin/churches/${c.id}`} className="text-sm text-sky-600 hover:text-sky-700 font-medium">Edit</Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
          <h3 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-sky-600">📊</span> Recent Activity
          </h3>
          {recentAudits.length === 0 ? (
            <div className="text-sm text-slate-500 p-4 bg-green-50 rounded-lg">No activity yet.</div>
          ) : (
            <ul className="space-y-3">
              {recentAudits.map((a: Audit) => (
                <li key={String(a.id)} className="flex justify-between items-center p-2 border-b border-green-100 last:border-b-0">
                  <div className="text-sm text-slate-700 truncate pr-2">{String(a.action ?? '')} — {String(a.resource ?? '')}</div>
                  <div className="text-xs text-slate-500 whitespace-nowrap">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>

      {/* Table preview: Churches */}
      <section className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
        <h3 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-sky-600">📋</span> All Churches (preview)
        </h3>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-green-100">
                <th className="p-3">Name</th>
                <th className="p-3">Pastor</th>
                <th className="p-3">Location</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(churches) ? churches : []).map((c: Church) => (
                <tr key={c.id} className="border-b border-green-100 last:border-b-0 hover:bg-green-50">
                  <td className="p-3 font-medium text-slate-800">{c.name}</td>
                  <td className="p-3 text-slate-700">{c.pastor ?? '—'}</td>
                  <td className="p-3 text-slate-700">{c.address ?? '—'}</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <Link href={`/admin/churches/${c.id}`} className="text-sky-600 hover:text-sky-700 font-medium">Edit</Link>
                      <button type="button" className="text-red-600 hover:text-red-700 font-medium">Deactivate</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer quick actions */}
      <section className="flex flex-wrap gap-3">
        <Link href="/admin/churches/import" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1">
          <span>📥</span> Import Churches (CSV)
        </Link>
        <Link href="/admin/donations" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1">
          <span>💰</span> View Donations
        </Link>
        <Link href="/admin/audit" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-1">
          <span>📊</span> Full Audit Logs
        </Link>
      </section>
    </div>
  )
}
