'use client'
import React from 'react'
import ChurchForm from '@/components/ChurchForm'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChurch } from '@fortawesome/free-solid-svg-icons'

export default function NewChurchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 flex items-center gap-3">
                <FontAwesomeIcon icon={faChurch} className="text-blue-500 text-2xl" />
                Create New Church
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Add a new church to your organization with all the necessary details
              </p>
            </div>
            {/* <Link 
              href="/admin/churches" 
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              Back to Churches
            </Link> */}
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
          <div className="p-1">
            <ChurchForm />
          </div>
        </div>
      </div>
    </div>
  )
}