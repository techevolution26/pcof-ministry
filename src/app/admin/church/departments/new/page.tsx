'use client'
import React from 'react'
import DepartmentForm from '@/components/DepartmentForm'

export default function NewDepartmentPage() {
    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">New department</h1>
            <DepartmentForm onSaved={() => { /* optionally show toast or redirect */ }} />
        </div>
    )
}
