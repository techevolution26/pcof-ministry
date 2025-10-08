'use client'
import React from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import ReconciliationForm from '@/components/ReconciliationForm'
import { useRouter } from 'next/navigation'

export default function NewReconciliationPage() {
    const { user, isLoading } = useAdminAuth()
    const router = useRouter()
    if (isLoading) return <div className="p-6">Loading…</div>

    const churchId = user?.church_id

    return (
        <div>
            <h1 className="text-lg font-semibold mb-4">New Reconciliation</h1>
            <ReconciliationForm churchId={churchId} onSaved={() => router.push('/admin/church/finance/reconciliations')} />
        </div>
    )
}
