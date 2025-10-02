// src/app/admin/members/[id]/edit/page.tsx
'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import MemberForm from '@/components/MemberForm'

export default function EditMemberPage() {
    const params = useParams()
    const rawId = params?.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Edit Member</h1>
            {id ? <MemberForm memberId={id} /> : <div>Invalid member id</div>}
        </div>
    )
}
