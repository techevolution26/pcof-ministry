'use client'
import React from 'react'
import ChurchDesignationForm from '@/components/ChurchDesignationForm'

export default function NewDesignationPage() {
    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">New designation</h1>
            <ChurchDesignationForm />
        </div>
    )
}
