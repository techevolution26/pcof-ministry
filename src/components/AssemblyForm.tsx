'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAssembly, updateAssembly, fetchAssemblyById, fetchChurches } from '@/lib/adminApi'

type Props = { assemblyId?: string | number }

export default function AssemblyForm({ assemblyId }: Props) {
    const router = useRouter()
    const [form, setForm] = useState({ name: '', church_id: '' })
    const [loading, setLoading] = useState<boolean>(Boolean(assemblyId))
    const [saving, setSaving] = useState(false)
    const [churches, setChurches] = useState<unknown[]>([])

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const ch = await fetchChurches()
                    if (mounted) setChurches(Array.isArray(ch) ? ch : (ch?.data ?? []))
                } catch { }
            })()
        return () => { mounted = false }
    }, [])

    useEffect(() => {
        if (!assemblyId) return setLoading(false)
        let mounted = true
            ; (async () => {
                try {
                    const body = await fetchAssemblyById(assemblyId)
                    const d = body?.data ?? body
                    if (!mounted) return
                    setForm({ name: d.name ?? '', church_id: d.church_id ?? '' })
                } catch (err) {
                    console.error(err)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [assemblyId])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            if (assemblyId) await updateAssembly(assemblyId, form)
            else await createAssembly(form)
            router.push('/admin/assemblies')
        } catch (err: unknown) {
            alert(err?.message ?? 'Save failed')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div>Loading…</div>

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
            <div>
                <label className="block text-sm font-medium">Name</label>
                <input name="name" value={form.name} onChange={onChange} required className="w-full p-2 border rounded" />
            </div>

            <div>
                <label className="block text-sm font-medium">Church</label>
                <select name="church_id" value={form.church_id ?? ''} onChange={onChange} className="w-full p-2 border rounded">
                    <option value="">— select church —</option>
                    {churches.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">
                    {saving ? 'Saving…' : assemblyId ? 'Save' : 'Create'}
                </button>
            </div>
        </form>
    )
}
