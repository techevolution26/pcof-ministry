'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import DepartmentForm from '@/components/DepartmentForm'
import { fetchDepartmentById } from '@/lib/adminApi'

export default function EditDepartmentPage() {
    const { id } = useParams() as { id?: string }
    const [initial, setInitial] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        if (!id) return
            ; (async () => {
                try {
                    const res = await fetchDepartmentById(id)
                    const data = res?.data ?? res
                    if (!mounted) return
                    setInitial(data)
                } catch (err) {
                    // handle
                } finally { if (mounted) setLoading(false) }
            })()
        return () => { mounted = false }
    }, [id])

    if (loading) return <div className="p-6 text-gray-500">Loading…</div>
    if (!initial) return <div className="p-6 text-red-600">Department not found</div>

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-4">Edit department</h1>
            <DepartmentForm departmentId={id} initial={initial} />
        </div>
    )
}
