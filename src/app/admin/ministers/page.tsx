'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchMinisters } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faUserPlus,
  faEye,
  faEdit,
  faSpinner,
  faArrowLeft,
  faChurch,
  faUserTie,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons'

export default function AdminMinistersPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res = await fetchMinisters()
          if (!mounted) return
          const list = Array.isArray(res) ? res : (res?.data ?? [])
          setItems(list)
        } catch (err) {
          console.error(err)
        } finally {
          if (mounted) setLoading(false)
        }
      })()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            className="mx-auto mb-4 text-2xl text-blue-600 animate-spin"
          />
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Loading ministers...
          </div>
        </div>
      </div>
    )
  }

  const activeMinisters = items.filter(m => m.active).length
  const inactiveMinisters = items.filter(m => !m.active).length

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
                Ministry Management
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                Manage ministers, their departments, and roles within the organization
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faUserTie} className="text-white text-lg" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeMinisters}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Active Ministers</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faUsers} className="text-white text-lg" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{items.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Ministers</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{items.length} ministers</span>
            </div>
          </div>
          <Link
            href="/admin/ministers/new"
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faUserPlus} />
            Add New Minister
          </Link>
        </div>

        {/* Ministers Table */}
        <section>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
            {items.length === 0 ? (
              <div className="text-center py-12 px-6">
                <FontAwesomeIcon
                  icon={faUserTie}
                  className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No ministers found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                  Get started by adding your first minister to the system.
                </p>
                <Link
                  href="/admin/ministers/new"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  Add Minister
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">Minister</th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">Department</th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                      <th className="text-left p-6 text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {items.map(m => (
                      <tr key={m.id} className="hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                              {m.member ? `${m.member.first_name?.charAt(0)}${m.member.last_name?.charAt(0)}` : 'M'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {m.member ? `${m.member.first_name} ${m.member.last_name}` : `#${m.member_id}`}
                              </div>
                              {m.member?.email && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">{m.member.email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            {m.department?.name ? (
                              <>
                                <FontAwesomeIcon icon={faChurch} className="text-blue-500 text-sm" />
                                <span className="text-gray-700 dark:text-gray-300">{m.department.name}</span>
                              </>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic">—</span>
                            )}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="text-gray-700 dark:text-gray-300">
                            {m.title || <span className="text-gray-400 dark:text-gray-500 italic">—</span>}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${m.active
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                            <FontAwesomeIcon icon={m.active ? faCheckCircle : faTimesCircle} />
                            {m.active ? 'Active' : 'Inactive'}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/ministers/${m.id}`}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 group/view"
                              title="View minister details"
                            >
                              <FontAwesomeIcon icon={faEye} className="group-hover/view:scale-110 transition-transform" />
                            </Link>
                            <Link
                              href={`/admin/ministers/${m.id}/edit`}
                              className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 group/edit"
                              title="Edit minister"
                            >
                              <FontAwesomeIcon icon={faEdit} className="group-hover/edit:scale-110 transition-transform" />
                            </Link>
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