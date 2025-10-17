'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchDesignationById, deleteDesignation } from '@/lib/adminApi'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faUserTie,
  faEdit,
  faTrash,
  faSpinner,
  faFileAlt,
  faCalendar,
  faIdCard
} from '@fortawesome/free-solid-svg-icons'

export default function DesignationShow() {
  const params = useParams() as { id?: string }
  const id = params?.id
  const router = useRouter()
  const [item, setItem] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    let mounted = true
      ; (async () => {
        try {
          const res = await fetchDesignationById(id)
          if (!mounted) return
          setItem(res?.data ?? res)
        } catch (err) { console.error(err) }
        finally { if (mounted) setLoading(false) }
      })()
    return () => { mounted = false }
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this designation? This action cannot be undone.')) return

    setDeleting(true)
    try {
      await deleteDesignation(item.id)
      router.push('/admin/designations')
    } catch (err: unknown) {
      alert(err?.message ?? 'Failed to delete designation')
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 dark:border-gray-700/50">
          <FontAwesomeIcon icon={faSpinner} className="mx-auto mb-4 text-2xl text-blue-600 animate-spin" />
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading designation details...</div>
        </div>
      </div>
    </div>
  )

  if (!item) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50 dark:border-gray-700/50">
          <div className="text-gray-600 dark:text-gray-400 text-center mb-4">Designation not found</div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mx-auto text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Go Back to Designations
          </button>
        </div>
      </div>
    </div>
  )

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              Back to Designations
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              {item.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Designation details and information
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/designations"
              className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              <span className="text-sm font-medium">All Designations</span>
            </Link>
            <Link
              href={`/admin/designations/${item.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FontAwesomeIcon icon={faEdit} className="text-sm" />
              <span className="text-sm font-medium">Edit Designation</span>
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-red-200/50 dark:border-red-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 shadow-sm hover:shadow-md text-red-600 dark:text-red-400 disabled:opacity-50"
            >
              {deleting ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faTrash} />
              )}
              <span className="text-sm font-medium">Delete</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Designation Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <FontAwesomeIcon icon={faUserTie} className="text-purple-500" />
                Designation Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Designation Name
                  </label>
                  <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {item.name}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Designation ID
                  </label>
                  <div className="mt-1 flex items-center gap-2 text-gray-900 dark:text-white">
                    <FontAwesomeIcon icon={faIdCard} className="text-gray-400 text-sm" />
                    <span className="font-mono">#{item.id}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileAlt} className="text-sm" />
                  Description
                </label>
                <div className="mt-2 p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                  {item.description ? (
                    <div className="text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                      {item.description}
                    </div>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 italic text-center py-4">
                      No description provided for this designation
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information Card */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <FontAwesomeIcon icon={faCalendar} className="text-green-500" />
                Additional Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Created Date
                  </label>
                  <div className="mt-1 flex items-center gap-2 text-gray-900 dark:text-white">
                    <FontAwesomeIcon icon={faCalendar} className="text-gray-400 text-sm" />
                    {formatDate(item.created_at)}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Last Updated
                  </label>
                  <div className="mt-1 flex items-center gap-2 text-gray-900 dark:text-white">
                    <FontAwesomeIcon icon={faCalendar} className="text-gray-400 text-sm" />
                    {formatDate(item.updated_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/admin/designations/${item.id}/edit`}
                  className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-700 transition-colors">
                    <FontAwesomeIcon icon={faEdit} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">Edit Designation</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Update designation details</div>
                  </div>
                </Link>

                <Link
                  href="/admin/designations"
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-500 transition-colors">
                    <FontAwesomeIcon icon={faUserTie} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">All Designations</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">View all designations</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Designation Stats */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200/50 dark:border-purple-700/50 p-6">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
                Designation Overview
              </h3>
              <div className="space-y-4">
                <div className="text-center p-4 bg-white/50 dark:bg-purple-900/30 rounded-xl border border-purple-200/50 dark:border-purple-600/50">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">Active</div>
                  <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">Designation Status</div>
                </div>
                <div className="flex justify-between text-sm text-purple-700 dark:text-purple-300">
                  <span>Created</span>
                  <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}