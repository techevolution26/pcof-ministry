// src/app/admin/churches/new/page.tsx
'use client'
import React from 'react'
import ChurchForm from '@/components/ChurchForm'

export default function NewChurchPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create Church</h1>
      <ChurchForm />
    </div>
  )
}
