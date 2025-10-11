// app/admin/finance/payments/new/page.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { fetchChurchesList, createPayment, fetchMembersForChurch } from '@/lib/adminApi'
import MemberTypeahead from '@/components/MemberTypeahead'
import Link from 'next/link'
import Toast from '@/components/Toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faArrowLeft,
    faPlus,
    faSave,
    faChurch,
    faUser,
    faFileInvoice,
    faMoneyBillWave,
    faDollarSign,
    faHashtag,
    faFileText,
    faCalendar,
    faSpinner
} from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'next/navigation'

export default function SuperAdminNewPaymentPage() {
    const router = useRouter()
    const [churches, setChurches] = useState<any[]>([])
    const [churchId, setChurchId] = useState<string | number | ''>('')
    const [member, setMember] = useState<any | null>(null)
    const [type, setType] = useState('collection')
    const [amount, setAmount] = useState<string | number>('')
    const [currency, setCurrency] = useState('KES')
    const [reference, setReference] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<any | null>(null)
    const [membersList, setMembersList] = useState<any[]>([])

    // Payment types with icons and descriptions
    const paymentTypes = [
        { value: 'collection', label: 'Collection', icon: faMoneyBillWave, description: 'Regular church collection' },
        { value: 'tithe', label: 'Tithe', icon: faDollarSign, description: 'Member tithe payment' },
        { value: 'offering', label: 'Offering', icon: faFileInvoice, description: 'Special offering' },
        { value: 'event_fee', label: 'Event Fee', icon: faCalendar, description: 'Event registration fee' },
        { value: 'donation', label: 'Donation', icon: faMoneyBillWave, description: 'General donation' }
    ]

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const list = await fetchChurchesList()
                if (!mounted) return
                setChurches(list)
            } catch (err) {
                console.error('Failed to load churches', err)
                setToast({ show: true, type: 'error', message: 'Failed to load churches list' })
            }
        })()
        return () => { mounted = false }
    }, [])

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!churchId) { setMembersList([]); return }
            try {
                const res = await fetchMembersForChurch(churchId as any, { per_page: 50 })
                if (!mounted) return
                const arr = Array.isArray(res) ? res : (res?.data ?? [])
                setMembersList(arr)
            } catch (err) {
                console.warn('Failed to prefetch members', err)
                setMembersList([])
            }
        })()
        return () => { mounted = false }
    }, [churchId])

    async function submit(e: React.FormEvent) {
        e.preventDefault()

        // Validation
        if (!amount || Number(amount) <= 0) {
            setToast({ show: true, type: 'error', message: 'Please enter a valid amount' })
            return
        }

        setSaving(true)
        try {
            const payload = {
                church_id: churchId || null,
                member_id: member?.id ?? null,
                type,
                amount: Number(amount),
                currency,
                reference: reference || `MANUAL_${Date.now()}`,
                description,
            }
            const res = await createPayment(payload)
            const saved = res?.data ?? res

            setToast({
                show: true,
                type: 'success',
                message: `Payment created successfully! Reference: ${saved.reference || saved.id}`
            })

            // Reset form
            setAmount('')
            setReference('')
            setDescription('')
            setMember(null)

            // Optional: Redirect after delay
            setTimeout(() => {
                router.push(`/admin/finance/payments/${saved.id}`)
            }, 2000)

        } catch (err: any) {
            console.error(err)
            setToast({
                show: true,
                type: 'error',
                message: err?.message ?? 'Failed to create payment. Please try again.'
            })
        } finally {
            setSaving(false)
        }
    }

    const getPaymentTypeIcon = (typeValue: string) => {
        const type = paymentTypes.find(t => t.value === typeValue)
        return type?.icon || faFileInvoice
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-900/20 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/admin/finance"
                                    className="w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 backdrop-blur-sm"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600 dark:text-gray-400" />
                                </Link>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                                        Record New Payment
                                    </h1>
                                    <p className="text-lg text-gray-600 dark:text-gray-300 font-light">
                                        Create a new payment transaction for collections, tithes, or offerings
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/admin/finance/payments"
                                className="px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600 dark:text-gray-400" />
                                View All Payments
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                            <FontAwesomeIcon icon={faPlus} className="text-green-500" />
                            Payment Details
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Fill in the payment information below. All fields are required unless marked optional.
                        </p>
                    </div>

                    <form onSubmit={submit} className="p-6 space-y-6">
                        {/* Church Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <FontAwesomeIcon icon={faChurch} className="text-blue-500" />
                                Church (Optional)
                            </label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faChurch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                <select
                                    value={String(churchId)}
                                    onChange={(e) => setChurchId(e.target.value || '')}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white appearance-none cursor-pointer transition-colors duration-200"
                                >
                                    <option value="">— Select a church (optional) —</option>
                                    {churches.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Selecting a church will filter members and help with reporting
                            </p>
                        </div>

                        {/* Member Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <FontAwesomeIcon icon={faUser} className="text-green-500" />
                                Member (Optional)
                            </label>
                            <MemberTypeahead
                                churchId={churchId || undefined}
                                value={member?.id ?? null}
                                onSelect={(m) => setMember(m)}
                                placeholder="Search for a member..."
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Associate this payment with a specific church member
                            </p>
                        </div>

                        {/* Payment Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <FontAwesomeIcon icon={faFileInvoice} className="text-purple-500" />
                                Payment Type
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {paymentTypes.map((paymentType) => (
                                    <button
                                        key={paymentType.value}
                                        type="button"
                                        onClick={() => setType(paymentType.value)}
                                        className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${type === paymentType.value
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === paymentType.value
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                <FontAwesomeIcon icon={paymentType.icon} />
                                            </div>
                                            <span className={`font-medium ${type === paymentType.value
                                                    ? 'text-blue-700 dark:text-blue-300'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {paymentType.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {paymentType.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount and Currency */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faDollarSign} className="text-green-500" />
                                    Amount *
                                </label>
                                <div className="relative">
                                    <FontAwesomeIcon icon={faDollarSign} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-colors duration-200"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-yellow-500" />
                                    Currency
                                </label>
                                <div className="relative">
                                    <FontAwesomeIcon icon={faMoneyBillWave} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white appearance-none cursor-pointer transition-colors duration-200"
                                    >
                                        <option value="KES">Kenyan Shilling (KES)</option>
                                        <option value="USD">US Dollar (USD)</option>
                                        <option value="EUR">Euro (EUR)</option>
                                        <option value="GBP">British Pound (GBP)</option>
                                        <option value="UGX">Ugandan Shilling (UGX)</option>
                                        <option value="TZS">Tanzanian Shilling (TZS)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Reference */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <FontAwesomeIcon icon={faHashtag} className="text-orange-500" />
                                Reference (Optional)
                            </label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faHashtag} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-colors duration-200"
                                    placeholder="Leave blank to auto-generate"
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Unique reference number. Auto-generated if left blank.
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <FontAwesomeIcon icon={faFileText} className="text-indigo-500" />
                                Description (Optional)
                            </label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faFileText} className="absolute left-4 top-4 text-gray-400" />
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 transition-colors duration-200 resize-vertical"
                                    placeholder="Add any additional details about this payment..."
                                />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                * Required fields
                            </div>

                            <div className="flex items-center gap-3">
                                <Link
                                    href="/admin/finance/payments"
                                    className="px-6 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 backdrop-blur-sm font-medium"
                                >
                                    Cancel
                                </Link>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl font-medium"
                                >
                                    {saving ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                            Creating Payment...
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faSave} />
                                            Create Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Quick Tips */}
                <div className="mt-6 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faFileInvoice} />
                        Quick Tips
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span>Always verify the amount and currency before submitting</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span>Use descriptive references for easy tracking and reconciliation</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                            <span>Associate payments with members for better reporting and member history</span>
                        </li>
                    </ul>
                </div>
            </div>

            {toast && (
                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}