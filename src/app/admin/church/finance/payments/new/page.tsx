'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import PaymentForm from '@/components/PaymentForm'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons'

export default function NewPaymentPage() {
  const { user, isLoading } = useAdminAuth()
  const router = useRouter()
  const initial = { church_id: user?.church_id }

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
          <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading...</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
            Back to Payments
          </button>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              Record New Payment
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create a new payment record for tithes, offerings, collections, or event fees
            </p>
          </div>

          <PaymentForm initial={initial} onSaved={() => router.push('/admin/church/finance/payments')} />
        </div>
      </div>
    </div>
  )
}