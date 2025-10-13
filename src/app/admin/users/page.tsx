'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAdminUsers, approveUser, revokeUser, fetchRoles, assignRoleToUser, removeRoleFromUser } from '@/lib/adminApi'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faPlus,
  faEye,
  faCheckCircle,
  faTimesCircle,
  faSpinner,
  faArrowLeft,
  faUserCheck,
  faUserSlash,
  faShield
} from '@fortawesome/free-solid-svg-icons'

export default function AdminUsersPage() {
  const { user } = useAdminAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<any[]>([])
  const [actionLoading, setActionLoading] = useState<number | null>(null)

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
    setActionLoading(id)
    await approveUser(id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: true } : u))
    setActionLoading(null)
  }

  async function handleRevoke(id: number) {
    setActionLoading(id)
    await revokeUser(id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u))
    setActionLoading(null)
  }

  async function toggleRole(userId: number, roleName: string, currentlyHas: boolean) {
    setActionLoading(userId)
    try {
      if (currentlyHas) await removeRoleFromUser(userId, roleName)
      else await assignRoleToUser(userId, roleName)
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        roles: currentlyHas ? u.roles.filter((r: any) => r !== roleName) : [...(u.roles || []), roleName]
      } : u))
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="mx-auto mb-4 text-2xl text-blue-600 animate-spin"
          />
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Loading users...
          </div>
        </div>
      </div>
    )
  }

  const activeUsers = users.filter(u => u.is_active).length
  const inactiveUsers = users.filter(u => !u.is_active).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
                >
                  <FontAwesomeIcon
                    icon={faArrowLeft}
                    className="text-sm group-hover:-translate-x-1 transition-transform"
                  />
                  <span className="text-sm font-medium">Back to Dashboard</span>
                </Link>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                User Management
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                Manage user accounts, permissions, and access levels
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserCheck} className="text-white text-lg" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeUsers}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active Users</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserSlash} className="text-white text-lg" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{inactiveUsers}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total: <span className="font-semibold text-gray-900 dark:text-white">{users.length} users</span>
            </div>
          </div>
          <Link
            href="/admin/users/new"
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Create New User
          </Link>
        </div>

        {/* Users Table */}
        <section>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
            {users.length === 0 ? (
              <div className="text-center py-12 px-6">
                <FontAwesomeIcon
                  icon={faUsers}
                  className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No users found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                  Get started by creating your first user account.
                </p>
                <Link
                  href="/admin/users/new"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Create User
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">User</th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">Roles</th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">{u.name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-wrap gap-2 max-w-xs">
                            {roles.map((r: any) => {
                              const has = (u.roles || []).includes(r.name)
                              return (
                                <button
                                  key={r.id}
                                  onClick={() => toggleRole(u.id, r.name, has)}
                                  disabled={actionLoading === u.id}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200 flex items-center gap-1.5 ${has
                                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                                    } ${actionLoading === u.id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                >
                                  <FontAwesomeIcon icon={faShield} className="text-xs" />
                                  {r.name}
                                  {has && <FontAwesomeIcon icon={faCheckCircle} className="text-xs ml-1" />}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${u.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                            }`}>
                            <FontAwesomeIcon icon={u.is_active ? faCheckCircle : faTimesCircle} />
                            {u.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/admin/users/${u.id}`}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 group/view"
                              title="View user details"
                            >
                              <FontAwesomeIcon icon={faEye} className="group-hover/view:scale-110 transition-transform" />
                            </Link>
                            {!u.is_active ? (
                              <button
                                onClick={() => handleApprove(u.id)}
                                disabled={actionLoading === u.id}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all duration-200 group/approve disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Approve user"
                              >
                                {actionLoading === u.id ? (
                                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                ) : (
                                  <FontAwesomeIcon icon={faCheckCircle} className="group-hover/approve:scale-110 transition-transform" />
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRevoke(u.id)}
                                disabled={actionLoading === u.id}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group/revoke disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Revoke user access"
                              >
                                {actionLoading === u.id ? (
                                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                ) : (
                                  <FontAwesomeIcon icon={faTimesCircle} className="group-hover/revoke:scale-110 transition-transform" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}