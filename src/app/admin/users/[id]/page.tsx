'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchAdminUser, approveUser, revokeUser, fetchRoles, assignRoleToUser, removeRoleFromUser } from '@/lib/adminApi'

export default function AdminUserShow() {
    const { id } = useParams() as { id?: string }
    const router = useRouter()
    const [user, setUser] = useState<any | null>(null)
    const [roles, setRoles] = useState<any[]>([])
    useEffect(() => {
        if (!id) return
        let mounted = true
            ; (async () => {
                const u = await fetchAdminUser(id)
                if (!mounted) return
                setUser(u?.data ?? u)
                const r = await fetchRoles().catch(() => [])
                if (!mounted) return
                setRoles(r)
            })()
        return () => { mounted = false }
    }, [id])

    if (!user) return <div>Loading…</div>

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <div className="text-sm text-gray-500">{user.email}</div>
                </div>
            </div>

            <div className="bg-white p-4 rounded shadow mb-4">
                <h3 className="font-semibold">Roles</h3>
                <div className="flex gap-2 mt-2">
                    {roles.map(r => {
                        const has = (user.roles || []).includes(r.name)
                        return (
                            <button key={r.id} onClick={async () => {
                                if (has) await removeRoleFromUser(user.id, r.name)
                                else await assignRoleToUser(user.id, r.name)
                                const refreshed = await fetchAdminUser(user.id)
                                setUser(refreshed?.data ?? refreshed)
                            }} className={`px-3 py-1 rounded ${has ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                                {r.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex gap-2">
                {user.is_active ? (
                    <button onClick={async () => { await revokeUser(user.id); router.replace('/admin/users') }} className="px-3 py-2 bg-red-50 text-red-600 rounded">Revoke</button>
                ) : (
                    <button onClick={async () => { await approveUser(user.id); router.replace('/admin/users') }} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>
                )}
            </div>
        </div>
    )
}
