// src/components/MinisterForm.tsx
'use client'
import React, { useEffect, useState } from 'react'
import {
    createMinister,
    updateMinister,
    fetchMinisterById,
    fetchChurchesList,
    fetchDesignationsList,
    fetchDepartmentsList
} from '@/lib/adminApi'
import { useRouter } from 'next/navigation'
import MemberTypeahead from './MemberTypeahead'

type FormShape = {
    member_id?: string | number
    church_id?: string | number | ''
    department_id?: string | number | ''
    designation_id?: string | number | ''
    title?: string
    started_at?: string
    ended_at?: string
    active?: boolean
}

export default function MinisterForm({ ministerId }: { ministerId?: string | number }) {
    const router = useRouter()
    const [form, setForm] = useState<FormShape>({
        member_id: '',
        church_id: '',
        department_id: '',
        designation_id: '',
        title: '',
        started_at: '',
        ended_at: '',
        active: true,
    })

    const [churches, setChurches] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [designations, setDesignations] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(Boolean(ministerId))
    const [saving, setSaving] = useState<boolean>(false)

    // Loading static lists: churches + designations (once)
    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const [chRes, desRes] = await Promise.allSettled([fetchChurchesList(), fetchDesignationsList()])
                    if (!mounted) return

                    if (chRes.status === 'fulfilled') {
                        const chList = Array.isArray(chRes.value) ? chRes.value : (chRes.value?.data ?? [])
                        setChurches(chList)
                    } else {
                        console.error('Failed to load churches', chRes.reason)
                    }

                    if (desRes.status === 'fulfilled') {
                        setDesignations(Array.isArray(desRes.value) ? desRes.value : (desRes.value?.data ?? []))
                    } else {
                        console.error('Failed to load designations', desRes.reason)
                    }
                } catch (err) {
                    console.error('Initial lists load failed', err)
                }
            })()
        return () => { mounted = false }
    }, [])

    // Loading departments for selected church (runs when church_id changes)
    useEffect(() => {
        let mounted = true
        async function loadDepartments(churchId?: string | number | '') {
            if (!churchId) { if (mounted) setDepartments([]); return }
            try {
                const res = await fetchDepartmentsList({ church_id: churchId })
                if (!mounted) return
                const list = Array.isArray(res) ? res : (res?.data ?? [])
                setDepartments(list)
            } catch (err) {
                console.error('Failed to load departments', err)
                if (mounted) setDepartments([])
            }
        }
        loadDepartments(form.church_id)
        return () => { mounted = false }
    }, [form.church_id])

    // Loading minister when editing; ensure departments for minister's church are loaded
    useEffect(() => {
        if (!ministerId) {
            setLoading(false)
            return
        }
        let mounted = true
            ; (async () => {
                try {
                    setLoading(true)
                    const res = await fetchMinisterById(ministerId!)
                    if (!mounted) return
                    const d = res?.data ?? res

                    const initial = {
                        member_id: d.member_id ?? (d.member?.id ?? ''),
                        church_id: d.church_id ?? '',
                        department_id: d.department_id ?? '',
                        designation_id: d.designation_id ?? '',
                        title: d.title ?? '',
                        started_at: d.started_at ? d.started_at.slice(0, 16) : '',
                        ended_at: d.ended_at ? d.ended_at.slice(0, 16) : '',
                        active: !!d.active,
                    }
                    setForm(initial)

                    // loading departments for this minister's church
                    if (initial.church_id) {
                        try {
                            const depRes = await fetchDepartmentsList({ church_id: initial.church_id })
                            if (!mounted) return
                            setDepartments(Array.isArray(depRes) ? depRes : (depRes?.data ?? []))
                        } catch (err) {
                            console.error('Failed to load departments for minister', err)
                        }
                    }
                } catch (err) {
                    console.error('Failed to load minister', err)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()
        return () => { mounted = false }
    }, [ministerId])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { name, value, type } = e.target as HTMLInputElement
        if (type === 'checkbox') {
            setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
        } else {
            setForm(prev => ({ ...prev, [name]: value }))
        }
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
            if (ministerId) {
                await updateMinister(ministerId, payload)
            } else {
                await createMinister(payload)
            }
            router.push('/admin/ministers')
        } catch (err: any) {
            const msg = err?.message ?? 'Save failed'
            alert(msg)
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div>Loading…</div>

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
            <div>
                <label className="block text-sm font-medium">Member</label>
                <MemberTypeahead
                    value={form.member_id}
                    onSelect={(m: any | null) => setForm(prev => ({ ...prev, member_id: m ? m.id : '' }))}
                    placeholder="Type a member name or email…"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Church</label>
                    <select name="church_id" value={String(form.church_id ?? '')} onChange={onChange} className="w-full p-2 border rounded">
                        <option value="">— select church —</option>
                        {churches.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">Department</label>
                    <select name="department_id" value={String(form.department_id ?? '')} onChange={onChange} className="w-full p-2 border rounded">
                        <option value="">— none —</option>
                        {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium">Designation (optional)</label>
                <select name="designation_id" value={String(form.designation_id ?? '')} onChange={onChange} className="w-full p-2 border rounded">
                    <option value="">— none —</option>
                    {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium">Title (override)</label>
                <input name="title" value={String(form.title ?? '')} onChange={onChange} className="w-full p-2 border rounded" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm">Started</label>
                    <input name="started_at" type="datetime-local" value={String(form.started_at ?? '')} onChange={onChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block text-sm">Ended</label>
                    <input name="ended_at" type="datetime-local" value={String(form.ended_at ?? '')} onChange={onChange} className="w-full p-2 border rounded" />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <input id="active" name="active" type="checkbox" checked={!!form.active} onChange={onChange} />
                <label htmlFor="active">Active</label>
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">
                    {saving ? 'Saving…' : (ministerId ? 'Save' : 'Create')}
                </button>
            </div>
        </form>
    )
}
