// src/components/AdminGuard.tsx
'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminGuard({ children, requireRole }: { children: React.ReactNode, requireRole?: string }) {
  const router = useRouter()
  const { user, isLoading } = useAdminAuth({ requireRole })

  // always register effect (stable hooks)
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/admin/login')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-gray-500">Verifying session…</div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
