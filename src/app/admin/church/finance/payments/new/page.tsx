'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import PaymentForm from '@/components/PaymentForm'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function NewPaymentPage() {
  const { user, isLoading } = useAdminAuth()
  const router = useRouter()
  const initial = { church_id: user?.church_id }

  if (isLoading) return <div className="p-6">Loading…</div>

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Record Payment</h1>
      <PaymentForm initial={initial} onSaved={() => router.push('/admin/church/finance/payments')} />
    </div>
  )
}
