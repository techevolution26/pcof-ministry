'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faShieldAlt } from '@fortawesome/free-solid-svg-icons'

export default function AdminGuard({ children, requireRole }: { children: React.ReactNode, requireRole?: string }) {
  const router = useRouter()
  const { user, isLoading } = useAdminAuth({ requireRole })

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/admin/login')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FontAwesomeIcon icon={faShieldAlt} className="text-white text-xl" />
          </div>
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Verifying Session
          </div>
          <div className="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-blue-500" />
            <span>Checking admin permissions...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}