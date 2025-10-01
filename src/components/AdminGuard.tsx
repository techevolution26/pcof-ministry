// src/components/AdminGuard.tsx
'use client'
import React, { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminGuard({ children, requireRole }: { children: ReactNode, requireRole?: string }) {
  const router = useRouter()
  const { user, isLoading } = useAdminAuth({ redirectTo: '/admin/login', requireRole })

  // While verifying show a single stable loader to keep SSR and client markup consistent.
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div style={{ width: 36, height: 36, border: '3px solid rgba(0,0,0,0.08)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div className="text-sm text-gray-500 mt-2">Verifying session…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  // If not loading and no user, the hook already redirected
  if (!user) return null

  return <>{children}</>
}
