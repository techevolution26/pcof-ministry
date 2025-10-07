'use client'
import React from 'react'
import DesignationForm from '@/components/DesignationForm'

export default function NewDesignationPage() {
    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">New designation</h1>
            <DesignationForm />
        </div>
    )
}
