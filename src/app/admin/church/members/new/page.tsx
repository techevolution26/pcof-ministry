'use client'

import React from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import ChurchMemberForm from '@/components/ChurchMemberForm'
import { useRouter } from 'next/navigation'

export default function NewMemberPage() {
    const { user, isLoading } = useAdminAuth()
    const router = useRouter()

    if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>
    if (!user) return <div className="p-6 text-red-600">Please sign in</div>
    if (user.role !== 'church_admin') return <div className="p-6 text-red-600">Not authorized</div>

    // prefill church_id from user to prevent selecting other churches
    const initial = { church_id: user.church_id }

    return (
        <div>
            <h1 className="text-lg font-semibold mb-4">New member</h1>
            <ChurchMemberForm initial={initial} onSaved={() => router.push('/admin/church/members')} />
        </div>
    )
}
