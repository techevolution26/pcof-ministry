// src/components/ChurchForm.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createChurch, updateChurch, fetchChurchById } from '@/lib/adminApi'

type Props = {
    churchId?: string | number
}

export default function ChurchForm({ churchId }: Props) {
    const [form, setForm] = useState<any>({
        name: '',
        branch: '',
        slug: '',
        address: '',
        pastor: '',
        description: '',
    })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const router = useRouter()

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!churchId) return
            try {
                const body = await fetchChurchById(churchId)
                const data = body?.data ?? body
                if (!mounted) return
                setForm({
                    name: data.name ?? '',
                    branch: data.branch ?? '',
                    slug: data.slug ?? '',
                    address: data.address ?? '',
                    pastor: data.pastor ?? '',
                    description: data.description ?? '',
                })
            } catch (err) {
                // ignore load errors here, caller can show notification
            }
        }
        load()
        return () => { mounted = false }
    }, [churchId])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setErrors({})
        setLoading(true)
        try {
            if (churchId) {
                await updateChurch(churchId, form)
            } else {
                await createChurch(form)
            }
            router.push('/admin/churches')
        } catch (err: any) {
            // backend returns { status:422, errors: { field: [...] } }
            if (err?.status === 422 && err.errors) setErrors(err.errors)
            else alert(err?.message ?? 'Save failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
            <div>
                <label className="block text-sm font-medium">Name</label>
                <input name="name" value={form.name} onChange={onChange} required className="w-full p-2 border rounded" />
                {errors.name && <div className="text-red-600 text-sm">{errors.name.join(' ')}</div>}
            </div>

            <div>
                <label className="block text-sm font-medium">Branch</label>
                <input name="branch" value={form.branch} onChange={onChange} className="w-full p-2 border rounded" />
            </div>

            <div>
                <label className="block text-sm font-medium">Pastor</label>
                <input name="pastor" value={form.pastor} onChange={onChange} className="w-full p-2 border rounded" />
            </div>

            <div>
                <label className="block text-sm font-medium">Address</label>
                <input name="address" value={form.address} onChange={onChange} className="w-full p-2 border rounded" />
            </div>

            <div>
                <label className="block text-sm font-medium">Slug (optional)</label>
                <input name="slug" value={form.slug} onChange={onChange} className="w-full p-2 border rounded" />
                {errors.slug && <div className="text-red-600 text-sm">{errors.slug.join(' ')}</div>}
            </div>

            <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea name="description" value={form.description} onChange={onChange} className="w-full p-2 border rounded" />
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={loading} className="px-4 py-2 bg-sky-600 text-white rounded">
                    {loading ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    )
}
