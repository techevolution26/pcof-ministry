// src/components/MinisterForm.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { createMinister, updateMinister, fetchMinisterById, fetchChurchesList, fetchAssemblies, fetchDesignationsList } from '@/lib/adminApi'
import { useRouter } from 'next/navigation'
import MemberTypeahead from './MemberTypeahead'

export default function MinisterForm({ ministerId }: { ministerId?: string | number }) {
    const router = useRouter()
    const [form, setForm] = useState<any>({ member_id: '', department_id: '', designation_id: '', title: '', started_at: '', ended_at: '', active: true })
    const [churches, setChurches] = useState<any[]>([])
    const [assemblies, setAssemblies] = useState<any[]>([])
    const [designations, setDesignations] = useState<any[]>([])
    const [loading, setLoading] = useState(Boolean(ministerId))
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const ch = await fetchChurchesList()
                    if (!mounted) return
                    setChurches(Array.isArray(ch) ? ch : (ch?.data ?? []))

                    const desigs = await fetchDesignationsList()
                    if (!mounted) return
                    setDesignations(desigs)
                } catch (err) { console.error(err) }
            })()
        return () => { mounted = false }
    }, [])

    // if department select should be loaded from a selected church, keep this behavior
    useEffect(() => {
        let mounted = true
        if (!form.church_id) {
            setAssemblies([])
            return
        }
        ; (async () => {
            try {
                const a = await fetchAssemblies({ church_id: form.church_id })
                if (!mounted) return
                setAssemblies(Array.isArray(a) ? a : (a?.data ?? []))
            } catch (err) { console.error(err) }
        })()
        return () => { mounted = false }
    }, [form.church_id])

    useEffect(() => {
        if (!ministerId) { setLoading(false); return }
        let mounted = true
            ; (async () => {
                try {
                    const res = await fetchMinisterById(ministerId!)
                    if (!mounted) return
                    const d = res?.data ?? res
                    setForm({
                        member_id: d.member_id ?? (d.member?.id ?? ''),
                        department_id: d.department_id ?? '',
                        designation_id: d.designation_id ?? '',
                        title: d.title ?? '',
                        started_at: d.started_at ? d.started_at.slice(0, 16) : '',
                        ended_at: d.ended_at ? d.ended_at.slice(0, 16) : '',
                        active: !!d.active,
                        church_id: d.church_id ?? ''
                    })
                } catch (err) { console.error(err) }
                finally { if (mounted) setLoading(false) }
            })()
        return () => { mounted = false }
    }, [ministerId])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value, type } = e.target as HTMLInputElement
        if (type === 'checkbox') setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
        else setForm(prev => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                ...form,
                started_at: form.started_at ? new Date(form.started_at).toISOString() : null,
                ended_at: form.ended_at ? new Date(form.ended_at).toISOString() : null,
            }
            if (ministerId) await updateMinister(ministerId, payload)
            else await createMinister(payload)
            router.push('/admin/ministers')
        } catch (err) { alert(err?.message ?? 'Save failed'); console.error(err) }
        finally { setSaving(false) }
    }

    if (loading) return <div>Loading…</div>

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
            <div>
                <label className="block text-sm font-medium">Member</label>
                <MemberTypeahead
                    value={form.member_id}
                    onSelect={(m) => setForm(prev => ({ ...prev, member_id: m ? m.id : '' }))}
                    placeholder="Type a member name or email…"
                    required
                />

            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Church</label>
                    <select name="church_id" value={form.church_id ?? ''} onChange={onChange} className="w-full p-2 border rounded">
                        <option value="">— select church —</option>
                        {churches.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">Department / Assembly</label>
                    <select name="department_id" value={form.department_id ?? ''} onChange={onChange} className="w-full p-2 border rounded">
                        <option value="">— none —</option>
                        {assemblies.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium">Designation (optional)</label>
                <select name="designation_id" value={form.designation_id ?? ''} onChange={onChange} className="w-full p-2 border rounded">
                    <option value="">— none —</option>
                    {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium">Title (override)</label>
                <input name="title" value={form.title ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">Started</label>
                    <input name="started_at" type="datetime-local" value={form.started_at ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block text-sm">Ended</label>
                    <input name="ended_at" type="datetime-local" value={form.ended_at ?? ''} onChange={onChange} className="w-full p-2 border rounded" />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <input id="active" name="active" type="checkbox" checked={!!form.active} onChange={onChange} />
                <label htmlFor="active">Active</label>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">{saving ? 'Saving…' : (ministerId ? 'Save' : 'Create')}</button>
            </div>
        </form>
    )
}
