'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChurchDepartmentForm from '@/components/ChurchDepartmentForm'
import { fetchDepartmentById } from '@/lib/adminApi'

/**
 * Type guard to check for objects with a `data` property.
 * Avoids using `any` while allowing safely extracting `.data`.
 */
function hasDataProp(v: unknown): v is { data: unknown } {
    return !!v && typeof v === 'object' && 'data' in v
}

export default function EditDepartmentPage() {
    const { id } = useParams() as { id?: string }
    const [initial, setInitial] = useState<unknown>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        if (!id) return
            ; (async () => {
                try {
                    const res = await fetchDepartmentById(id)
                    // safely extract .data if present, otherwise use the response
                    const data = hasDataProp(res) ? res.data : res
                    if (!mounted) return
                    setInitial(data)
                } catch (error: unknown) {
                    // keep a console log for debugging; this also uses the caught variable
                    // and silences the "defined but never used" warning
                    // eslint-disable-next-line no-console
                    console.error('Failed to load department', error)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [id])

    if (loading) return <div className="p-6 text-gray-500">Loading…</div>
    if (!initial) return <div className="p-6 text-red-600">Department not found</div>

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">Edit department</h1>
            <ChurchDepartmentForm departmentId={id} initial={initial} />
        </div>
    )
}
