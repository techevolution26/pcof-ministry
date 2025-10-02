'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import AssemblyForm from '@/components/AssemblyForm'

export default function EditAssemblyPage() {
  const { id } = useParams() as { id?: string }
  if (!id) return <div>Invalid id</div>
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Assembly</h1>
      <AssemblyForm assemblyId={id} />
    </div>
  )
}
