// src/app/admin/departments/new/page.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import DepartmentForm from '@/components/DepartmentForm'

export default function NewDepartmentPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Create department</h1>
                    <p className="text-sm text-gray-500">Create a new department (optionally assign to a church).</p>
                </div>
                <Link href="/admin/departments" className="px-3 py-2 bg-gray-100 rounded text-sm">Back to departments</Link>
            </div>

            <div className="max-w-3xl">
                <DepartmentForm />
            </div>
        </div>
    )
}
