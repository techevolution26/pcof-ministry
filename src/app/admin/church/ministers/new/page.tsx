'use client'
import React from 'react'
import Link from 'next/link'
import ChurchMinisterForm from '@/components/ChurchMinisterForm'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faUserTie } from '@fortawesome/free-solid-svg-icons'

export default function NewMinisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/church/ministers"
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
                New Minister
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                Add a new minister to your church
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 shadow-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon icon={faUserTie} className="text-white text-lg" />
              </div>
            </div>
          </div>
        </header>

        {/* Form Section */}
        <section>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
            <div className="p-6">
              <ChurchMinisterForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}