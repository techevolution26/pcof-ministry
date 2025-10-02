// src/app/admin/churches/[id]/edit/page.tsx
'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import ChurchForm from '@/components/ChurchForm'

export default function EditChurchPage() {
  const params = useParams()
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Church</h1>
      {id ? <ChurchForm churchId={id} /> : <div>Invalid church id</div>}
    </div>
  )
}
