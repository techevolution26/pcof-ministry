'use client'
import React from 'react'
import ChurchDepartmentForm from '@/components/ChurchDepartmentForm'

export default function NewDepartmentPage() {
    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">New department</h1>
            <ChurchDepartmentForm onSaved={() => { /* optionally show toast or redirect */ }} />
        </div>
    )
}
