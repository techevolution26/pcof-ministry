'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { fetchDepartmentById } from '@/lib/adminApi'

export default function DepartmentShowPage() {
    const params = useParams()
    const rawId = Array.isArray(params?.id) ? params?.id[0] : params?.id
    const id = rawId ?? null
    const router = useRouter()
    const { user, isLoading } = useAdminAuth()

    const [department, setDepartment] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            setLoading(true); setError(null)
            try {
                if (!id) return
                const body = await fetchDepartmentById(id)
                if (!mounted) return
                const data = body?.data ?? body
                // church admin access enforcement: if user is church_admin, ensure department belongs to same church
                if (user?.role === 'church_admin' && user?.church_id && data?.church_id != user.church_id) {
                    router.replace('/admin/church')
                    return
                }
                setDepartment(data)
            } catch (err: any) {
                setError(err?.message ?? 'Failed to load department')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        if (!isLoading) load()
        return () => { mounted = false }
    }, [id, isLoading, user, router])

    if (isLoading || loading) return <div className="p-6">Loading…</div>
    if (error) return <div className="p-6 text-red-600">{error}</div>
    if (!department) return <div className="p-6 text-gray-500">Not found</div>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">{department.name}</h1>
                <div>
                    <Link href={`/admin/church/departments/${id}/edit`} className="px-3 py-1 border rounded">Edit</Link>
                    <Link href="/admin/church/departments" className="px-3 py-1 border rounded ml-2">Back</Link>
                </div>
            </div>

            <div className="bg-white rounded shadow p-4">
                <div className="text-sm text-gray-500">Description</div>
                <div className="mt-2">{department.description ?? '—'}</div>
            </div>
        </div>
    )
}
