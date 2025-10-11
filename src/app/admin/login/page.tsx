'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/lib/adminApi'
import { verifyAdmin as apiVerifyAdmin } from '@/lib/adminApi'
import { setAdminUser } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserShield,
  faEnvelope,
  faLock,
  faSignInAlt,
  faSpinner,
  faChurch,
  faUsers,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await login(email, password)

      if (res?.token) {
        const verified = await apiVerifyAdmin()
        if (!verified) {
          setError('Account verification failed. Please try again.')
          setLoading(false)
          return
        }

        try { setAdminUser(verified) } catch { /* ignore */ }

        // Role-based redirect
        if (verified.role === 'superadmin') {
          router.replace('/admin')
          return
        }
        if (verified.role === 'church_admin') {
          router.replace('/admin/church')
          return
        }
        router.replace('/admin')
        return
      }

      setError(res?.message ?? 'Your account is pending approval.')
    } catch (err: any) {
      setError(err?.message ?? 'Sign in failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-4">
            <FontAwesomeIcon icon={faUserShield} className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
            Admin Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Sign in to access your administration dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700/50 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FontAwesomeIcon icon={faSignInAlt} className="text-blue-500 text-lg" />
              Sign In to Your Account
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enter your credentials to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <FontAwesomeIcon icon={faEnvelope} className="text-blue-500 text-sm" />
                Email Address
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <FontAwesomeIcon icon={faLock} className="text-purple-500 text-sm" />
                Password
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-3">
                <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-500 text-sm">!</span>
                </div>
                <div className="text-sm">{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:opacity-50 transition-all duration-200 font-semibold flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="text-white text-sm animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSignInAlt} className="text-white text-sm" />
                  Sign In to Dashboard
                </>
              )}
            </button>

            {/* Register Link */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link
                  href="/admin/register"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                >
                  Create one here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/50 dark:border-gray-700/50">
            <FontAwesomeIcon icon={faChurch} className="text-blue-500 text-xl mb-2" />
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Church Management</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Manage multiple churches</div>
          </div>
          <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/50 dark:border-gray-700/50">
            <FontAwesomeIcon icon={faUsers} className="text-purple-500 text-xl mb-2" />
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Member Tracking</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Comprehensive member database</div>
          </div>
          <div className="text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/50 dark:border-gray-700/50">
            <FontAwesomeIcon icon={faUserShield} className="text-indigo-500 text-xl mb-2" />
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Secure Access</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Role-based permissions</div>
          </div>
        </div>
      </div>
    </div>
  )
}