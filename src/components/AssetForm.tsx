// src/components/AssetForm.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    createAdminAsset,
    createAdminAssetFormData,
    updateAdminAsset,
    updateAdminAssetFormData,
    fetchAssetById,
    fetchChurchesList,
} from '@/lib/adminApi'

type Props = { assetId?: string | number }

function normalizeFileUrl(url?: string | null) {
    if (!url) return null
    if (/^https?:\/\//i.test(url)) return url
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
    if (!base) return url
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export default function AssetForm({ assetId }: Props) {
    const router = useRouter()

    const [form, setForm] = useState<unknown>({
        name: '',
        description: '',
        church_id: '',
        location: '',
    })
    const [churches, setChurches] = useState<unknown[]>([])
    const [loading, setLoading] = useState<boolean>(Boolean(assetId))
    const [saving, setSaving] = useState<boolean>(false)
    const [errors, setErrors] = useState<Record<string, string[]>>({})

    const fileRef = useRef<HTMLInputElement | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null) // object URL for selected file
    const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null) // normalized backend URL

    // Load churches for select
    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const ch = await fetchChurchesList()
                    if (!mounted) return
                    setChurches(Array.isArray(ch) ? ch : (ch?.data ?? []))
                } catch (err) {
                    // ignore
                }
            })()
        return () => { mounted = false }
    }, [])

    // Load existing asset when editing
    useEffect(() => {
        if (!assetId) {
            setLoading(false)
            return
        }
        let mounted = true

            ; (async () => {
                try {
                    const body = await fetchAssetById(assetId)
                    const data = body?.data ?? body
                    if (!mounted) return

                    setForm({
                        name: data.name ?? '',
                        description: data.description ?? '',
                        church_id: data.church_id ?? '',
                        location: data.location ?? '',
                    })
                    setExistingFileUrl(normalizeFileUrl(data.file_url ?? null))
                } catch (err) {
                    console.error('Failed to load asset', err)
                } finally {
                    if (mounted) setLoading(false)
                }
            })()

        return () => { mounted = false }
    }, [assetId])

    // Revoke preview URL on unmount to avoid memory leak
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        const target = e.target as HTMLInputElement
        const { name, value } = target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null

        // revoke previous preview if any
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }

        if (!f) {
            // user cleared selection - keep existingFileUrl as-is (user may cancel)
            return
        }

        // If image -> create object URL for preview, otherwise preview stays null (we'll show filename)
        if (f.type && f.type.startsWith('image/')) {
            const url = URL.createObjectURL(f)
            setPreviewUrl(url)
        } else {
            setPreviewUrl(null)
        }

        // hide existing file preview while new file selected
        setExistingFileUrl(null)
    }

    function removeSelectedFile() {
        if (fileRef.current) {
            fileRef.current.value = ''
        }
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl(null)
        }
        // don't restore existingFileUrl automatically — user explicitly removed file
        setExistingFileUrl(null)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setErrors({})

        try {
            const payload = { ...form }
            const file = fileRef.current?.files?.[0] ?? null

            if (assetId) {
                if (file) {
                    // multipart with _method=PUT handled in helper
                    await updateAdminAssetFormData(assetId, payload, file)
                } else {
                    await updateAdminAsset(assetId, payload)
                }
            } else {
                if (file) {
                    await createAdminAssetFormData(payload, file)
                } else {
                    await createAdminAsset(payload)
                }
            }

            router.push('/admin/assets')
        } catch (err: unknown) {
            if (err?.status === 422 && err.errors) {
                setErrors(err.errors)
            } else {
                const msg = err?.message ?? 'Save failed'
                alert(msg)
                console.error(err)
            }
        } finally {
            setSaving(false)
        }
    }

    // JSX
    if (loading) return <div className="p-6 bg-white rounded shadow text-sm text-gray-600">Loading…</div>

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
            <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    required
                    className="w-full p-2 border rounded"
                />
                {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name.join(' ')}</div>}
            </div>

            <div>
                <label className="block text-sm font-medium">Church</label>
                <select name="church_id" value={form.church_id ?? ''} onChange={onChange} className="w-full p-2 border rounded">
                    <option value="">— none —</option>
                    {churches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.church_id && <div className="text-red-600 text-sm mt-1">{errors.church_id.join(' ')}</div>}
            </div>

            <div>
                <label className="block text-sm font-medium">Location</label>
                <input name="location" value={form.location} onChange={onChange} className="w-full p-2 border rounded" />
                {errors.location && <div className="text-red-600 text-sm mt-1">{errors.location.join(' ')}</div>}
            </div>

            <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea name="description" value={form.description} onChange={onChange} rows={4} className="w-full p-2 border rounded" />
                {errors.description && <div className="text-red-600 text-sm mt-1">{errors.description.join(' ')}</div>}
            </div>

            <div>
                <label className="block text-sm font-medium">File (optional)</label>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileInputChange}
                    className="mt-2"
                />

                {/* preview selected image */}
                {previewUrl && (
                    <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Preview</div>
                        <img src={previewUrl} alt="preview" className="max-h-40 rounded border" />
                        <div>
                            <button type="button" onClick={removeSelectedFile} className="text-sm text-red-600 mt-2">Remove selected file</button>
                        </div>
                    </div>
                )}

                {/* show existing file if present and no new selection */}
                {!previewUrl && existingFileUrl && (
                    <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-1">Existing file</div>
                        {/\.(jpg|jpeg|png|gif|webp)$/i.test(existingFileUrl) ? (
                            <img src={existingFileUrl} alt="existing" className="max-h-40 rounded border" />
                        ) : (
                            <a href={existingFileUrl} target="_blank" rel="noreferrer" className="text-sky-600">
                                {existingFileUrl.split('/').pop()}
                            </a>
                        )}
                        <div>
                            <button
                                type="button"
                                onClick={() => {
                                    // clear existing file preview so user can upload new one
                                    setExistingFileUrl(null)
                                    if (fileRef.current) fileRef.current.value = ''
                                }}
                                className="text-sm text-red-600 mt-2"
                            >
                                Remove existing file
                            </button>
                        </div>
                    </div>
                )}

                {errors.file && <div className="text-red-600 text-sm mt-1">{errors.file.join(' ')}</div>}
            </div>

            <div className="flex justify-end">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-600 text-white rounded">
                    {saving ? 'Saving…' : assetId ? 'Save asset' : 'Create asset'}
                </button>
            </div>
        </form>
    )
}
