'use client'
import React, { useEffect, useState } from 'react'
import Toast from './Toast'
import { createPayment } from '@/lib/adminApi'
import EventTypeahead from './EventTypeahead'
import ChurchMemberTypeahead from './ChurchMemberTypeahead'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSave,
    faSpinner,
    faChurch,
    faUser,
    faReceipt,
    faDollarSign,
    faFileAlt,
    faCalendar
} from '@fortawesome/free-solid-svg-icons'

type Props = { initial?: any; onSaved?: (p: any) => void }

export default function PaymentForm({ initial = {}, onSaved }: Props) {
    const { user, isLoading } = useAdminAuth()
    const churchIdFromUser = user?.church_id

    const [form, setForm] = useState<any>({
        church_id: initial.church_id ?? churchIdFromUser ?? '',
        event_id: initial.event_id ?? null,
        member_id: initial.member_id ?? null,
        type: initial.type ?? 'collection',
        amount: initial.amount ?? '',
        currency: initial.currency ?? 'KES',
        reference: initial.reference ?? '',
        description: initial.description ?? '',
        payment_method: initial.payment_method ?? 'in-person',
    })
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<any>(null)

    useEffect(() => {
        // if user is church_admin, enforce church_id in the form
        if (!isLoading && user?.role === 'church_admin') {
            setForm(prev => ({ ...prev, church_id: user.church_id }))
        }
    }, [user, isLoading])

    function onChange(e: any) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    async function handleEventSelect(ev: any) {
        // set event and infer church_id if event belongs to a church
        setForm(prev => ({
            ...prev,
            event_id: ev?.id ?? null,
            church_id: ev?.church_id ?? prev.church_id
        }))
    }

    async function handleMemberSelect(member: any) {
        setForm(prev => ({ ...prev, member_id: member?.id ?? null }))
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                ...form,
                amount: Number(form.amount),
            }
            const res = await createPayment(payload)
            const saved = res?.data ?? res
            setToast({ show: true, message: 'Payment recorded successfully!', type: 'success' })
            setTimeout(() => onSaved?.(saved), 1500)
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to save payment', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Church Field (Superadmin only) */}
            {user?.role === 'superadmin' && (
                <div className="bg-white/50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faChurch} className="text-blue-500" />
                        Church
                    </label>
                    <input
                        name="church_id"
                        value={form.church_id}
                        onChange={onChange}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter church ID or select from list"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Selection */}
                <div className="bg-white/50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendar} className="text-purple-500" />
                        Event (Optional)
                    </label>
                    <EventTypeahead
                        churchId={form.church_id || undefined}
                        onSelect={handleEventSelect}
                        value={form.event_id}
                    />
                </div>

                {/* Member Selection */}
                <div className="bg-white/50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-green-500" />
                        Member (Optional)
                    </label>
                    <ChurchMemberTypeahead
                        churchId={form.church_id || undefined}
                        onSelect={handleMemberSelect}
                        value={form.member_id}
                    />
                </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white/50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faReceipt} className="text-blue-500" />
                    Payment Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Payment Type
                        </label>
                        <select
                            name="type"
                            value={form.type}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="collection">Collection</option>
                            <option value="tithe">Tithe</option>
                            <option value="offering">Offering</option>
                            <option value="event_fee">Event Fee</option>
                        </select>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Payment Method
                        </label>
                        <select
                            name="payment_method"
                            value={form.payment_method}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="in-person">In Person</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="mobile_money">Mobile Money</option>
                            <option value="online">Online</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <FontAwesomeIcon icon={faDollarSign} className="text-green-500" />
                            Amount
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={form.amount}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            required
                            placeholder="0.00"
                            step="0.01"
                        />
                    </div>

                    {/* Currency */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Currency
                        </label>
                        <input
                            name="currency"
                            value={form.currency}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="KES, USD, etc."
                        />
                    </div>
                </div>

                {/* Reference */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Reference Number
                    </label>
                    <input
                        name="reference"
                        value={form.reference}
                        onChange={onChange}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Payment reference or receipt number"
                    />
                </div>

                {/* Description */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faFileAlt} className="text-gray-500" />
                        Description
                    </label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={onChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Additional notes or description for this payment..."
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-6 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg font-medium"
                >
                    {saving ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faSave} />
                            Save Payment
                        </>
                    )}
                </button>
            </div>

            {toast && (
                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </form>
    )
}