'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import MinisterForm from '@/components/MinisterForm'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'

export default function EditMinisterPage() {
  const params = useParams() as { id?: string }
  const id = params?.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/ministers"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
                >
                  <FontAwesomeIcon
                    icon={faArrowLeft}
                    className="text-sm group-hover:-translate-x-1 transition-transform"
                  />
                  <span className="text-sm font-medium">Back to Ministers</span>
                </Link>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                {id ? 'Edit Minister' : 'Add New Minister'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                {id ? 'Update minister details and assignments' : 'Create a new minister profile and assign roles'}
              </p>
            </div>
          </div>
        </header>

        {/* Form Section */}
        <section>
          {id ? (
            <MinisterForm ministerId={id} />
          ) : (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 p-8 text-center">
              <div className="text-red-500 text-lg font-medium">Invalid minister ID</div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                The minister you're trying to edit could not be found.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}