// src/app/admin/members/new/page.tsx
'use client'
import React from 'react'
import MemberForm from '@/components/MemberForm'

export default function NewMemberPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Add Member</h1>
      <MemberForm />
    </div>
  )
}
