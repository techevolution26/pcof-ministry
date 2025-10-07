// src/hooks/useAdminAuth.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminUser, setAdminUser, verifyAdmin as apiVerifyAdmin, logout as apiLogout } from '@/lib/adminApi'

export function useAdminAuth(options?: { requireRole?: string }) {
  const requireRole = options?.requireRole
  const router = useRouter()

  // hydrate from localStorage to avoid flash
  const [user, setUser] = useState<any | null>(() => {
    try { return typeof window !== 'undefined' ? getAdminUser() : null } catch { return null }
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true
    async function init() {
      setIsLoading(true)
      try {
        const verified = await apiVerifyAdmin()
        if (!mounted) return
        if (!verified) {
          setUser(null)
          setAdminUser(null)
          setIsLoading(false)
          return
        }
        if (requireRole && verified.role !== requireRole) {
          setUser(null)
          setAdminUser(null)
          setIsLoading(false)
          return
        }
        setUser(verified)
        setAdminUser(verified)
        setIsLoading(false)
      } catch (err) {
        if (!mounted) return
        setUser(null)
        setAdminUser(null)
        setIsLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [requireRole])

  const logout = useCallback(async () => {
    try { await apiLogout() } catch { /* ignore */ }
    setUser(null)
    try { setAdminUser(null) } catch { }
    // let the caller decide navigation; but we can default to login
    router.push('/admin/login')
  }, [router])

  // at end of function
  const isSuperadmin = Boolean(user?.role === 'superadmin')
  const isChurchAdmin = Boolean(user?.role === 'church_admin')

  return { user, isLoading, logout, setUser, isSuperadmin, isChurchAdmin }
}
