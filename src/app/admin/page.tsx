// Admin Dashboard UI Scaffold
// app/admin/dashboard-ui.tsx
// Server component (App Router) — static-first, SSR-ready
// Reads from lib/api (uses public JSON for now) and renders a polished admin dashboard UI.

import Link from 'next/link'
import Image from 'next/image'
import { fetchChurches, fetchSermons, fetchEvents } from '@/lib/api'

export const revalidate = 60

export default async function AdminDashboardUI() {
  const [churches, sermons, events] = await Promise.all([
    fetchChurches().catch(() => []),
    fetchSermons().catch(() => []),
    fetchEvents().catch(() => []),
  ])

  // optional audit.json
  let audits: any[] = []
  try {
    const res = await fetch('/data/audit.json')
    if (res.ok) audits = await res.json()
  } catch (e) {
    audits = []
  }

  // compute sample KPIs
  const totalChurches = Array.isArray(churches) ? churches.length : 0
  const totalSermons = Array.isArray(sermons) ? sermons.length : 0
  const totalEvents = Array.isArray(events) ? events.length : 0

  // sample recent items
  const recentChurches = (churches || []).slice(0, 6)
  const recentAudits = audits.slice(0, 8)

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-slate-600 mt-1">Overview of recent activity and quick actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/churches/new" className="px-3 py-2 bg-sky-600 text-white rounded">Create Church</Link>
          <Link href="/admin/churches" className="px-3 py-2 border rounded">Manage Churches</Link>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-slate-500">Churches</div>
          <div className="text-2xl font-semibold">{totalChurches}</div>
          <div className="text-xs text-slate-400 mt-2">Active churches in the network</div>
        </div>

        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-slate-500">Sermons</div>
          <div className="text-2xl font-semibold">{totalSermons}</div>
          <div className="text-xs text-slate-400 mt-2">Published teachings</div>
        </div>

        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="text-sm text-slate-500">Upcoming Events</div>
          <div className="text-2xl font-semibold">{totalEvents}</div>
          <div className="text-xs text-slate-400 mt-2">Events scheduled across churches</div>
        </div>
      </section>

      {/* Quick analytics row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border rounded p-4">
          <h3 className="font-semibold mb-3">Recent Churches</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentChurches.map((c: any) => (
              <div key={c.id} className="p-3 border rounded flex gap-3 items-center">
                <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center text-sm text-slate-600">
                  {c.logoUrl ? (
                    <Image src={c.logoUrl} alt={c.name} width={48} height={48} style={{ objectFit: 'cover' }} />
                  ) : (
                    <span>{(c.name || '').split(' ').map((s: string) => s[0]).slice(0,2).join('')}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.address ?? '—'}</div>
                </div>
                <div>
                  <Link href={`/admin/churches/${c.id}`} className="text-sm underline">Edit</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="bg-white border rounded p-4">
          <h3 className="font-semibold mb-3">Recent Activity</h3>
          {recentAudits.length === 0 ? (
            <div className="text-sm text-slate-500">No activity yet.</div>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentAudits.map(a => (
                <li key={a.id} className="flex justify-between">
                  <div className="truncate pr-2">{a.action} — {a.resource}</div>
                  <div className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>

      {/* Table preview: Churches */}
      <section className="bg-white border rounded p-4">
        <h3 className="font-semibold mb-3">All Churches (preview)</h3>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="p-2">Name</th>
                <th className="p-2">Pastor</th>
                <th className="p-2">Location</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(churches || []).map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.pastor ?? '—'}</td>
                  <td className="p-2">{c.address ?? '—'}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <Link href={`/admin/churches/${c.id}`} className="text-sky-600 underline">Edit</Link>
                      <button className="text-red-600 underline">Deactivate</button>
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
        <Link href="/admin/churches/import" className="px-3 py-2 border rounded">Import Churches (CSV)</Link>
        <Link href="/admin/donations" className="px-3 py-2 border rounded">View Donations</Link>
        <Link href="/admin/audit" className="px-3 py-2 border rounded">Full Audit Logs</Link>
      </section>
    </div>
  )
}

/*
How to use:
- Place this file as a server component and import it in `app/admin/page.tsx` or replace your existing admin page with:

  import AdminDashboardUI from './dashboard-ui'
  export default function Page() { return <AdminDashboardUI /> }

- It reads from your existing lib/api.json-based helpers. When you migrate to Prisma, update the data calls in the top of the file.
- Next improvements: add charts (e.g., Recharts), server-side pagination & filters for the table, modals for edit/confirm, and inline role management.
*/
