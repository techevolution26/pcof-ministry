// src/hooks/useAdminAuth.tsx
'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminUser, setAdminUser, getAdminToken, verifyAdmin as apiVerifyAdmin, logout as apiLogout } from '@/lib/adminApi'

export function useAdminAuth(options?: { redirectTo?: string, requireRole?: string }) {
  const router = useRouter()
  const redirectTo = options?.redirectTo ?? '/admin/login'
  const requireRole = options?.requireRole

  // initial user from localStorage if any — this prevents flicker of null -> user on the client,
  // but we still verify on mount.
  const [user, setUser] = useState<any | null>(() => {
    try { return typeof window !== 'undefined' ? getAdminUser() : null } catch { return null }
  })
  const [isLoading, setIsLoading] = useState<boolean>(user ? true : true) // always verify once

  useEffect(() => {
    let mounted = true
    async function init() {
      setIsLoading(true)
      try {
        const verified = await apiVerifyAdmin()
        if (!mounted) return
        // verified is the user object if token ok, null otherwise
        if (!verified) {
          setUser(null)
          setIsLoading(false)
          // redirect to login
          router.replace(redirectTo)
          return
        }
        if (requireRole && verified.role && verified.role !== requireRole) {
          // not allowed
          setUser(null)
          setIsLoading(false)
          router.replace(redirectTo)
          return
        }
        setUser(verified)
        setAdminUser(verified)
        setIsLoading(false)
      } catch (err) {
        if (!mounted) return
        setUser(null)
        setIsLoading(false)
        router.replace(redirectTo)
      }
    }
    init()
    return () => { mounted = false }
  }, [redirectTo, requireRole, router])

  const logout = useCallback(async () => {
    try { await apiLogout() } catch { }
    // clear client state
    setUser(null)
    try { setAdminUser(null) } catch { }
    router.push('/admin/login')
  }, [router])

  return { user, isLoading, logout, setUser }
}
