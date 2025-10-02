'use client'
import React, { useEffect, useState } from 'react'
import { fetchRoles, createRole, updateRole, deleteRole } from '@/lib/adminApi'

export default function AdminRolesPage() {
    const [roles, setRoles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')

    useEffect(() => {
        let mounted = true; (async () => {
            const r = await fetchRoles().catch(() => [])
            if (mounted) setRoles(r)
            setLoading(false)
        })(); return () => { mounted = false }
    }, [])

    async function handleCreate() {
        if (!name) return
        const r = await createRole({ name }).catch(e => { alert(e?.message || 'err') })
        if (r) setRoles(prev => [...prev, r])
        setName('')
    }

    if (loading) return <div>Loading roles…</div>
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Roles</h1>
            <div className="mb-4 flex gap-2">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Role name" className="p-2 border rounded" />
                <button onClick={handleCreate} className="px-3 py-2 bg-sky-600 text-white rounded">Create</button>
            </div>

            <div className="bg-white rounded shadow">
                <ul>
                    {roles.map(r => (
                        <li key={r.id} className="p-3 border-b last:border-b-0 flex justify-between">
                            <div>{r.name}</div>
                            <div>
                                <button onClick={async () => { if (confirm('Delete role?')) { await deleteRole(r.id); setRoles(prev => prev.filter(x => x.id !== r.id)) } }} className="text-red-600">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
