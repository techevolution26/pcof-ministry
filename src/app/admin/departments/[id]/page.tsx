// src/app/admin/departments/[id]/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fetchDepartmentById, fetchMinisters, deleteDepartment } from '@/lib/adminApi'

export default function DepartmentShowPage() {
    const params = useParams() as { id?: string }
    const id = params?.id
    const router = useRouter()

    const [department, setDepartment] = useState<any | null>(null)
    const [ministers, setMinisters] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [minLoading, setMinLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!id) {
                setError('Invalid department id')
                setLoading(false)
                return
            }
            setLoading(true)
            try {
                const depRes = await fetchDepartmentById(id)
                if (!mounted) return
                const dep = depRes?.data ?? depRes
                setDepartment(dep)
            } catch (err: any) {
                console.error('Failed to load department', err)
                setError(err?.message ?? 'Failed to load department')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [id])

    useEffect(() => {
        // load ministers for this department
        if (!id) return
        let mounted = true
        async function loadMinisters() {
            setMinLoading(true)
            try {
                const res = await fetchMinisters({ department_id: id })
                if (!mounted) return
                const list = Array.isArray(res) ? res : (res?.data ?? [])
                setMinisters(list)
            } catch (err) {
                console.error('Failed to load ministers', err)
            } finally {
                if (mounted) setMinLoading(false)
            }
        }
        loadMinisters()
        return () => { mounted = false }
    }, [id])

    async function handleDelete() {
        if (!id) return
        if (!confirm('Delete this department? This action cannot be undone.')) return
        try {
            await deleteDepartment(id)
            router.push('/admin/departments')
        } catch (err) {
            alert('Delete failed')
            console.error(err)
        }
    }

    if (loading) return <div>Loading department…</div>
    if (error) return <div className="text-red-600">{error}</div>
    if (!department) return <div className="text-sm text-gray-500">Department not found.</div>

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{department.name}</h1>
                    <div className="text-sm text-gray-500">{department.description ?? 'No description'}</div>
                    {department.church && (
                        <div className="mt-2 text-sm">
                            <span className="text-xs text-gray-400">Church: </span>
                            <Link href={`/admin/churches/${department.church.id}`} className="text-sky-600">{department.church.name}</Link>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Link href={`/admin/departments/${department.id}/edit`} className="px-3 py-2 bg-sky-600 text-white rounded">Edit</Link>
                    <button onClick={handleDelete} className="px-3 py-2 bg-red-50 text-red-600 rounded">Delete</button>
                </div>
            </div>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Ministers</h2>

                <div className="bg-white rounded shadow overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-gray-500">
                            <tr>
                                <th className="p-3">Member</th>
                                <th className="p-3">Designation</th>
                                <th className="p-3">Title</th>
                                <th className="p-3">Started</th>
                                <th className="p-3">Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {minLoading && <tr><td colSpan={5} className="p-4 text-sm text-gray-500">Loading ministers…</td></tr>}
                            {!minLoading && ministers.length === 0 && <tr><td colSpan={5} className="p-4 text-gray-500">No ministers found for this department.</td></tr>}
                            {!minLoading && ministers.map(m => (
                                <tr key={m.id} className="border-t last:border-b">
                                    <td className="p-3">
                                        {m.member ? `${m.member.first_name} ${m.member.last_name}` : `#${m.member_id}`}
                                    </td>
                                    <td className="p-3">{m.designation?.name ?? '—'}</td>
                                    <td className="p-3">{m.title ?? '—'}</td>
                                    <td className="p-3">{m.started_at ? new Date(m.started_at).toLocaleDateString() : '—'}</td>
                                    <td className="p-3">{m.active ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4">
                    <Link href={`/admin/ministers/new?department_id=${department.id}`} className="px-3 py-2 bg-sky-600 text-white rounded">Add minister</Link>
                </div>
            </section>
        </div>
    )
}
