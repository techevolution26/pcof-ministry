'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchReconciliationById } from '@/lib/adminApi'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import ReconciliationForm from '@/components/ReconciliationForm'
import Link from 'next/link'

export default function ReconciliationShowPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params?.id[0] : params?.id
    const id = rawId ?? null
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()

    const [rec, setRec] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true)
            try {
                if (!id) return
                const res = await fetchReconciliationById(id)
                if (!mounted) return
                setRec(res?.data ?? res)
            } catch (err) {
                console.error(err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [id, isLoading])

    if (isLoading || loading) return <div className="p-6">Loading…</div>
    if (!rec) return <div className="p-6 text-gray-500">Not found</div>

    return (
        <div>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h1 className="text-xl font-semibold">Reconciliation #{rec.id}</h1>
                    <div className="text-sm text-gray-500">{rec.statement_reference ?? '—'}</div>
                </div>
                <div className="flex gap-2">
                    {!editing && <button onClick={() => setEditing(true)} className="px-3 py-1 border rounded">Edit</button>}
                    <Link href="/admin/church/finance/reconciliations" className="px-3 py-1 border rounded">Back</Link>
                </div>
            </div>

            {!editing ? (
                <div className="bg-white rounded shadow p-4">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <dt className="text-xs text-gray-500">Payment</dt>
                            <dd>{rec.payment ? (rec.payment.reference ?? `#${rec.payment.id}`) : '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Amount</dt>
                            <dd>{rec.statement_amount ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Date</dt>
                            <dd>{rec.statement_date ?? '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-gray-500">Status</dt>
                            <dd>{rec.status}</dd>
                        </div>
                        <div className="col-span-full">
                            <dt className="text-xs text-gray-500">Notes</dt>
                            <dd>{rec.notes ? JSON.stringify(rec.notes) : '—'}</dd>
                        </div>
                    </dl>
                </div>
            ) : (
                <ReconciliationForm initial={rec} churchId={user?.church_id} onSaved={() => router.replace(`/admin/church/finance/reconciliations/${rec.id}`)} />
            )}
        </div>
    )
}
