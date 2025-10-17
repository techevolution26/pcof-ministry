'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

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
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
                <div className="text-center">
                    <FontAwesomeIcon
                        icon={faSpinner}
                        className="mx-auto mb-4 text-2xl text-blue-600 animate-spin"
                    />
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Verifying church admin access...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </div>
        </div>
    )
}