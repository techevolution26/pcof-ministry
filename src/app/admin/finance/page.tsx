// src/app/admin/finance/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { apiGet } from '@/lib/adminApi'

export default function AdminFinancePage() {
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const body = await apiGet('/api/admin/finance/summary')
        if (!mounted) return
        setSummary(body)
      } catch (err: any) {
        if (!mounted) return
        setError(err?.message ?? 'Failed to load finance summary')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) return <div>Loading finance summary…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Finance</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Donations</div>
          <div className="text-2xl font-bold">{summary?.donations_total ?? 0}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Tithes (30d)</div>
          <div className="text-2xl font-bold">{summary?.tithes_30d ?? 0}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Pending Collections</div>
          <div className="text-2xl font-bold">{summary?.collections_pending ?? 0}</div>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Recent Payments</h2>
        {(summary?.recent_payments ?? []).length === 0 ? (
          <div className="text-sm text-gray-500">No recent payments</div>
        ) : (
          <ul className="divide-y">
            {summary.recent_payments.map((p: any) => (
              <li key={p.id} className="py-2 flex justify-between">
                <div>
                  <div className="font-medium">{p.type} — {p.reference ?? p.id}</div>
                  <div className="text-xs text-gray-500">{p.member_name ?? p.phone} • {new Date(p.created_at).toLocaleString()}</div>
                </div>
                <div className="font-semibold">{p.amount} {p.currency ?? 'KES'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
