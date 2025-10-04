'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import MinisterForm from '@/components/MinisterForm'

export default function EditMinisterPage(){
  const params = useParams() as { id?: string }
  const id = params?.id
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit minister</h1>
      {id ? <MinisterForm ministerId={id} /> : <div>Invalid id</div>}
    </div>
  )
}
