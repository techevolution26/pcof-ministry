'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAdminUsers, approveUser, revokeUser, fetchRoles, assignRoleToUser, removeRoleFromUser } from '@/lib/adminApi'
import { useAdminAuth } from '@/hooks/useAdminAuth'

export default function AdminUsersPage() {
  const { user } = useAdminAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<any[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const u = await fetchAdminUsers()
        if (!mounted) return
        setUsers(Array.isArray(u) ? u : (u?.data ?? []))
        const r = await fetchRoles().catch(() => [])
        if (!mounted) return
        setRoles(r)
      } catch (err) {
        console.error('Failed to load admin users or roles:', err)
        try {
          // JSON.stringify on Error often yields {}, include non-enumerable props for more detail
          console.error('Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
        } catch (_) { }
        setUsers([])
        setRoles([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  async function handleApprove(id: number) {
    await approveUser(id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: true } : u))
  }
  async function handleRevoke(id: number) {
    await revokeUser(id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u))
  }

  async function toggleRole(userId: number, roleName: string, currentlyHas: boolean) {
    try {
      if (currentlyHas) await removeRoleFromUser(userId, roleName)
      else await assignRoleToUser(userId, roleName)
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        roles: currentlyHas ? u.roles.filter((r: any) => r !== roleName) : [...(u.roles || []), roleName]
      } : u))
    } catch (err) { console.error(err) }
  }

  if (loading) return <div>Loading users…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <Link href="/admin/users/new" className="px-3 py-2 bg-sky-600 text-white rounded">Create</Link>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role(s)</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t last:border-b">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <div className="flex gap-2 flex-wrap">
                    {roles.map((r: any) => {
                      const has = (u.roles || []).includes(r.name)
                      return (
                        <button key={r.id} onClick={() => toggleRole(u.id, r.name, has)}
                          className={`px-2 py-1 text-xs rounded ${has ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>
                          {r.name}
                        </button>
                      )
                    })}
                  </div>
                </td>
                <td className="p-3">{u.is_active ? 'Active' : 'Inactive'}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/users/${u.id}`} className="text-sky-600">View</Link>
                    {!u.is_active ? <button onClick={() => handleApprove(u.id)} className="text-green-600">Approve</button> : <button onClick={() => handleRevoke(u.id)} className="text-red-600">Revoke</button>}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={5} className="p-4 text-gray-500">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
