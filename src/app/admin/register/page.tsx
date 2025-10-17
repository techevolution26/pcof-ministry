'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { register, verifyAdmin } from '@/lib/adminApi'
import ChurchTypeahead from '@/components/ChurchTypeahead'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import {
  faUserPlus,
  faUser,
  faEnvelope,
  faLock,
  faUserShield,
  faChurch,
  faSpinner,
  faEye,
  faEyeSlash,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons'

type Role = 'church_admin' | 'superadmin' | 'viewer'

export default function AdminRegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('church_admin')
  const [selectedChurch, setSelectedChurch] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<unknown>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setErrors(null)
    setLoading(true)

    try {
      const payload: unknown = { name, email, password, role }
      if (role === 'church_admin' && selectedChurch?.id) payload.church_id = selectedChurch.id

      const res = await register(payload)

      if (res?.token) {
        try { await verifyAdmin() } catch (_) { /* ignore */ }
        router.replace('/admin')
        return
      }

      setMessage(res?.message ?? 'Registration successful — awaiting admin approval.')
    } catch (err: unknown) {
      if (err?.status === 422) setErrors(err.errors)
      else setMessage(err?.message ?? 'Registration failed. Please try again.')
      console.error('Registration error', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-4">
            <FontAwesomeIcon icon={faUserPlus} className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
            Create Admin Account
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Join the administration team with appropriate permissions
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700/50 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <FontAwesomeIcon icon={faUserShield} className="text-blue-500 text-lg" />
                Account Registration
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Fill in your details to create an admin account
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
              Back
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="text-blue-500 text-sm" />
                  Full Name *
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                  />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                {errors?.name && (
                  <div className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.name.join(', ')}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <FontAwesomeIcon icon={faEnvelope} className="text-purple-500 text-sm" />
                  Email Address *
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                  />
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                {errors?.email && (
                  <div className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.email.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <FontAwesomeIcon icon={faLock} className="text-green-500 text-sm" />
                Password *
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  type={showPassword ? "text" : "password"}
                  required
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
              {errors?.password && (
                <div className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {errors.password.join(', ')}
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <FontAwesomeIcon icon={faUserShield} className="text-orange-500 text-sm" />
                Admin Role *
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="church_admin">Church Admin (Requires Approval)</option>
                <option value="viewer">Viewer (Read-only Access)</option>
                <option value="superadmin">Super Admin (Requires Approval)</option>
              </select>
              {errors?.role && (
                <div className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {errors.role.join(', ')}
                </div>
              )}
            </div>

            {/* Church Selection for Church Admins */}
            {role === 'church_admin' && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <FontAwesomeIcon icon={faChurch} className="text-indigo-500 text-sm" />
                  Church Assignment (Optional)
                </label>
                <ChurchTypeahead
                  value={selectedChurch?.id ?? ''}
                  onSelect={(c) => setSelectedChurch(c)}
                  placeholder="Start typing to search for a church..."
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUserShield} className="text-xs" />
                  Church selection does not bypass approval — super admin will confirm assignment.
                </div>
                {errors?.church_id && (
                  <div className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.church_id.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            {message && (
              <div className={`p-4 rounded-xl border ${message.includes('successful') || message.includes('awaiting')
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${message.includes('successful') || message.includes('awaiting')
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                    <span className={`text-sm ${message.includes('successful') || message.includes('awaiting')
                      ? 'text-green-500'
                      : 'text-red-500'
                      }`}>!</span>
                  </div>
                  <div className="text-sm">{message}</div>
                </div>
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
                  Creating Account...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUserPlus} className="text-white text-sm" />
                  Create Admin Account
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  href="/admin/login"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}