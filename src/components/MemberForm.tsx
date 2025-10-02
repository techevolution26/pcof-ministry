// src/components/MemberForm.tsx
'use client'
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createMember, updateMember, fetchMemberById, fetchChurchesList } from '@/lib/adminApi'

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

        // set initial values only once (avoid stomping user's in-flight edits)
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      if (!form) throw new Error('Form not ready')

      const payload: any = { ...form }

      // Do not attempt to override member_number when updating
      if (memberId) {
        delete payload.member_number
      }

      // Clean empty string -> null for optional foreign keys
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
    return <div className="p-6 bg-white rounded shadow text-sm text-gray-600">Loading member…</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">First name</label>
          <input name="first_name" value={form.first_name ?? ''} onChange={onChange} required className="w-full p-2 border rounded" />
          {errors.first_name && <div className="text-red-600 text-sm">{errors.first_name.join(' ')}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Last name</label>
          <input name="last_name" value={form.last_name ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
          {errors.last_name && <div className="text-red-600 text-sm">{errors.last_name.join(' ')}</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Phone</label>
          <input name="phone" value={form.phone ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
          {errors.phone && <div className="text-red-600 text-sm">{errors.phone.join(' ')}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" value={form.email ?? ''} onChange={onChange} type="email" className="w-full p-2 border rounded" />
          {errors.email && <div className="text-red-600 text-sm">{errors.email.join(' ')}</div>}
        </div>
      </div>

      {/* Church selection instead of plain assembly_id */}
      <div>
        <label className="block text-sm font-medium">Church</label>
        <select name="church_id" value={String(form.church_id ?? '')} onChange={onChange} className="w-full p-2 border rounded">
          <option value="">— Select church —</option>
          {churches.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name ?? c.title ?? `#${c.id}`}
            </option>
          ))}
        </select>
        {errors.church_id && <div className="text-red-600 text-sm">{errors.church_id.join(' ')}</div>}
      </div>

      {/* Member number: show readonly when editing, hide when creating */}
      {memberId ? (
        <div>
          <label className="block text-sm font-medium">Member number</label>
          <input name="member_number" value={form.member_number ?? ''} readOnly disabled className="w-full p-2 border rounded bg-gray-50" />
          <div className="text-xs text-gray-500 mt-1">Member numbers are generated automatically and cannot be changed.</div>
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium">Gender</label>
        <select name="gender" value={form.gender ?? 'male'} onChange={onChange} className="w-full p-2 border rounded">
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        {errors.gender && <div className="text-red-600 text-sm">{errors.gender.join(' ')}</div>}
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">
          {saving ? 'Saving…' : 'Save member'}
        </button>
      </div>
    </form>
  )
}
