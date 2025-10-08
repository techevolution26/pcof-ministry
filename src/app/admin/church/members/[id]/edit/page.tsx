'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import ChurchMemberForm from '@/components/ChurchMemberForm'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function MemberEditPage() {
    const { user, isLoading } = useAdminAuth()
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params?.id[0] : params?.id
    const id = rawId ?? null

    if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>

    // the MemberForm will load the member by id; we do quick guard here:
    if (!user || user.role !== 'church_admin') {
        return <div className="p-6 text-red-600">Not authorized to edit</div>
    }

    return (
        <div>
            <h1 className="text-lg font-semibold mb-4">Edit member</h1>
            <ChurchMemberForm memberId={id} />
        </div>
    )
}
