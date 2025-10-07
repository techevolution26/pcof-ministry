// app/admin/church/layout.tsx
'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function ChurchLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isChurchAdmin } = useAdminAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/admin/login')
            } else if (!isChurchAdmin) {
                // not a church admin — redirect to normal admin (or /admin)
                router.replace('/admin')
            } else if (!user?.church_id) {
                // church admin without church id, redirect to profile/setup page
                router.replace('/admin')
            }
        }
    }, [isLoading, user, isChurchAdmin, router])

    if (isLoading || !user) {
        return <div className="min-h-[60vh] flex items-center justify-center text-sm text-gray-600">Loading…</div>
    }

    // small header for the church section (optional)
    return (
        <div className="space-y-4">
            <header className="mb-2">
                <h1 className="text-xl font-semibold">My Church</h1>
                <div className="text-sm text-gray-500">Manage your church — members, assets, finance and events.</div>
            </header>

            <div>{children}</div>
        </div>
    )
}
