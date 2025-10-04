'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import DesignationForm from '@/components/DesignationForm'

export default function EditDesignation() {
  const params = useParams() as { id?: string }
  const id = params?.id
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Designation</h1>
      {id ? <DesignationForm designationId={id} /> : <div>Invalid id</div>}
    </div>
  )
}
