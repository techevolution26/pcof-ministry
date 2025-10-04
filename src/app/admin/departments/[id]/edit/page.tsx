// src/app/admin/departments/[id]/edit/page.tsx
'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import DepartmentForm from '@/components/DepartmentForm'
import Link from 'next/link'

export default function EditDepartmentPage() {
  const params = useParams() as { id?: string }
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const router = useRouter()

  if (!id) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Edit Department</h1>
        <div className="text-red-600">Invalid department id</div>
        <div className="mt-4">
          <Link href="/admin/departments" className="px-3 py-2 bg-gray-100 rounded">Back</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit department</h1>
          <p className="text-sm text-gray-500">Update department details.</p>
        </div>
        <div>
          <Link href={`/admin/departments/${id}`} className="px-3 py-2 bg-gray-100 rounded text-sm">Back to department</Link>
        </div>
      </div>

      <div className="max-w-3xl">
        <DepartmentForm departmentId={id} />
      </div>
    </div>
  )
}
