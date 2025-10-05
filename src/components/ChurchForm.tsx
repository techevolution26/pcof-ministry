// src/components/ChurchForm.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createChurch, updateChurch, fetchChurchById } from '@/lib/adminApi'
import Toast from './Toast'

type Props = {
    churchId?: string | number
}

export default function ChurchForm({ churchId }: Props) {
    const [form, setForm] = useState<any>({
        name: '',
        branch: '',
        address: '',
        pastor: '',
        description: '',
        // keep slug off the form — backend will create a unique slug automatically if omitted
    })
    const [loading, setLoading] = useState(false) // form submit loading
    const [initialLoading, setInitialLoading] = useState(Boolean(churchId)) // load existing church
    const [errors, setErrors] = useState<Record<string, string[]>>({})

    const [toast, setToast] = useState<{ show: boolean; message?: string; type?: 'success' | 'error' | 'info' }>({ show: false })

    const router = useRouter()

    // load existing church
    useEffect(() => {
        let mounted = true
        async function load() {
            if (!churchId) return setInitialLoading(false)
            try {
                const body = await fetchChurchById(churchId)
                const data = body?.data ?? body
                if (!mounted) return
                setForm({
                    name: data.name ?? '',
                    branch: data.branch ?? '',
                    address: data.address ?? '',
                    pastor: data.pastor ?? '',
                    description: data.description ?? '',
                })
            } catch (err) {
                // ignore load errors here; caller page can show notification
                console.error('Failed to load church', err)
            } finally {
                if (mounted) setInitialLoading(false)
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
            const payload = { ...form }
            let res
            if (churchId) {
                res = await updateChurch(churchId, payload)
            } else {
                res = await createChurch(payload)
            }

            // show success toast, then navigate after a short delay so the user sees feedback
            setToast({ show: true, message: 'Saved successfully', type: 'success' })
            setTimeout(() => {
                setToast({ show: false })
                router.push('/admin/churches')
            }, 700)
        } catch (err: any) {
            if (err?.status === 422 && err.errors) {
                setErrors(err.errors)
                // show brief error toast
                setToast({ show: true, message: 'Please correct the highlighted fields', type: 'error' })
            } else {
                const msg = err?.message ?? 'Save failed'
                setToast({ show: true, message: msg, type: 'error' })
                console.error(err)
            }
        } finally {
            setLoading(false)
        }
    }

    if (initialLoading) {
        return (
            <div className="p-6 bg-white rounded shadow text-sm text-gray-600">Loading church…</div>
        )
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        required
                        className="w-full p-2 border rounded"
                        placeholder="Church name"
                    />
                    {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name.join(' ')}</div>}
                </div>

                <div>
                    <label className="block text-sm font-medium">Branch</label>
                    <input name="branch" value={form.branch} onChange={onChange} className="w-full p-2 border rounded" placeholder="Branch or location (optional)" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Pastor</label>
                        <input name="pastor" value={form.pastor} onChange={onChange} className="w-full p-2 border rounded" placeholder="Lead pastor (optional)" />
                    </div>

                    {/* members count removed by request */}
                </div>

                <div>
                    <label className="block text-sm font-medium">Address</label>
                    <input name="address" value={form.address} onChange={onChange} className="w-full p-2 border rounded" placeholder="Street, city, region" />
                </div>

                {/* slug removed; the system will create unique slugs server-side */}

                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea name="description" value={form.description} onChange={onChange} className="w-full p-2 border rounded" rows={4} />
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={loading} className="px-4 py-2 bg-sky-600 text-white rounded">
                        {loading ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </form>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ show: false })}
            />
        </>
    )
}
