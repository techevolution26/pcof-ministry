'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import ChurchForm from '@/components/ChurchForm'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChurch, faEdit, faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'

export default function EditChurchPage() {
  const params = useParams()
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId

  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8">
            <div className="text-red-600 dark:text-red-400 text-xl font-semibold mb-4">
              Invalid Church ID
            </div>
            <Link 
              href="/admin/churches" 
              className="inline-block px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Back to Churches
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 flex items-center gap-3">
                <FontAwesomeIcon icon={faEdit} className="text-purple-500 text-2xl" />
                Edit Church Details
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Update church information and configuration settings
              </p>
            </div>
            <Link 
              href="/admin/churches" 
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              Back to Churches
            </Link>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
          <div className="p-1">
            <ChurchForm churchId={id} />
          </div>
        </div>
      </div>
    </div>
  )
}