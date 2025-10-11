'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faShieldAlt } from '@fortawesome/free-solid-svg-icons'

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <FontAwesomeIcon icon={faShieldAlt} className="text-white text-2xl" />
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 dark:border-blue-900 dark:border-t-blue-400 mx-auto mb-4" />
        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Admin Portal Loading
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          Securely loading your administration dashboard...
        </div>
      </div>
    </div>
  )
}