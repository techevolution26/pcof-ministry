'use client'
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createMember, updateMember, fetchMemberById, fetchChurchesList } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUsers,
  faSave,
  faSpinner,
  faArrowLeft,
  faUser,
  faPhone,
  faEnvelope,
  faChurch,
  faVenusMars,
  faIdCard,
  faInfo
} from '@fortawesome/free-solid-svg-icons'

type Props = { memberId?: string | number }

type MemberFormShape = {
  first_name?: string
  last_name?: string
  phone?: string
  email?: string
  church_id?: string | number | null
  member_number?: string
  gender?: 'male' | 'female' | ''
  [k: string]: any
}

export default function MemberForm({ memberId }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<MemberFormShape | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(memberId))
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [churches, setChurches] = useState<Array<any>>([])
  const initialLoadedRef = useRef(false)

  const empty: MemberFormShape = {
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    church_id: '',
    member_number: '',
    gender: 'male',
  }

  // Load churches for select
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchChurchesList()
        if (!mounted) return
        setChurches(list)
      } catch (err) {
        console.error('Failed to load churches', err)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Load member when editing
  useEffect(() => {
    let mounted = true
    async function load() {
      if (!memberId) {
        setForm({ ...empty })
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const body = await fetchMemberById(memberId)
        const data = body?.data ?? body?.member ?? body

        if (!mounted) return

        if (!initialLoadedRef.current) {
          initialLoadedRef.current = true
          setForm({
            first_name: data?.first_name ?? '',
            last_name: data?.last_name ?? '',
            phone: data?.phone ?? '',
            email: data?.email ?? '',
            church_id: data?.church_id ?? '',
            member_number: data?.member_number ?? '',
            gender: data?.gender ?? 'male',
          })
        }
      } catch (err: any) {
        console.error('Failed to load member', err)
        if (err?.status === 401 || err?.status === 403) {
          window.location.href = '/admin/login'
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [memberId])

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...(prev ?? {}), [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: [] }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      if (!form) throw new Error('Form not ready')

      const payload: any = { ...form }

      if (memberId) {
        delete payload.member_number
      }

      if (payload.church_id === '') payload.church_id = null

      if (memberId) {
        await updateMember(memberId, payload)
      } else {
        await createMember(payload)
      }

      router.push('/admin/members')
    } catch (err: any) {
      if (err?.status === 422 && err.errors) {
        setErrors(err.errors)
      } else {
        const msg = err?.message ?? 'Save failed'
        alert(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading || form === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-8">
            <div className="flex items-center justify-center gap-3 py-12">
              <FontAwesomeIcon icon={faSpinner} className="text-blue-500 text-xl animate-spin" />
              <div className="text-gray-600 dark:text-gray-400 font-medium">Loading member details...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                {memberId ? 'Edit Member' : 'Create New Member'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {memberId ? 'Update member information and details' : 'Add a new member to your organization'}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              Back
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-8">
          {/* Personal Information Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <FontAwesomeIcon icon={faUser} className="text-blue-500 text-lg" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="text-blue-500 text-xs" />
                  First Name *
                </label>
                <input
                  name="first_name"
                  value={form.first_name ?? ''}
                  onChange={onChange}
                  required
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.first_name ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 mt-1">
                    <span>⚠</span>
                    {errors.first_name.join(' ')}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Last Name
                </label>
                <input
                  name="last_name"
                  value={form.last_name ?? ''}
                  onChange={onChange}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.last_name ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 mt-1">
                    <span>⚠</span>
                    {errors.last_name.join(' ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <FontAwesomeIcon icon={faPhone} className="text-green-500 text-lg" />
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <FontAwesomeIcon icon={faPhone} className="text-green-500 text-xs" />
                  Phone Number
                </label>
                <input
                  name="phone"
                  value={form.phone ?? ''}
                  onChange={onChange}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.phone ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 mt-1">
                    <span>⚠</span>
                    {errors.phone.join(' ')}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <FontAwesomeIcon icon={faEnvelope} className="text-purple-500 text-xs" />
                  Email Address
                </label>
                <input
                  name="email"
                  value={form.email ?? ''}
                  onChange={onChange}
                  type="email"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.email ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 mt-1">
                    <span>⚠</span>
                    {errors.email.join(' ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Membership Details Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <FontAwesomeIcon icon={faUsers} className="text-orange-500 text-lg" />
              Membership Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <FontAwesomeIcon icon={faChurch} className="text-orange-500 text-xs" />
                  Church
                </label>
                <select
                  name="church_id"
                  value={String(form.church_id ?? '')}
                  onChange={onChange}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.church_id ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                    }`}
                >
                  <option value="">— Select church —</option>
                  {churches.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name ?? c.title ?? `Church #${c.id}`}
                    </option>
                  ))}
                </select>
                {errors.church_id && (
                  <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 mt-1">
                    <span>⚠</span>
                    {errors.church_id.join(' ')}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <FontAwesomeIcon icon={faVenusMars} className="text-pink-500 text-xs" />
                  Gender
                </label>
                <select
                  name="gender"
                  value={form.gender ?? 'male'}
                  onChange={onChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && (
                  <div className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 mt-1">
                    <span>⚠</span>
                    {errors.gender.join(' ')}
                  </div>
                )}
              </div>
            </div>

            {/* Member Number (Readonly when editing) */}
            {memberId && (
              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <FontAwesomeIcon icon={faIdCard} className="text-blue-500 text-xs" />
                  Member Number
                </label>
                <input
                  name="member_number"
                  value={form.member_number ?? ''}
                  readOnly
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-xl mt-2"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faInfo} className="text-xs" />
                  Member numbers are automatically generated and cannot be changed.
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:opacity-50 transition-all duration-200 font-semibold flex items-center gap-2"
            >
              {saving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="text-sm animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="text-sm" />
                  {memberId ? 'Update Member' : 'Create Member'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}