'use client'
import React, { useState } from 'react'
import PaymentTypeahead from './PaymentTypeahead'
import { createReconciliation, updateReconciliation } from '@/lib/adminApi'
import Toast from './Toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSave,
    faSpinner,
    faFileInvoice,
    faMoneyBillWave,
    faCalendar,
    faFileAlt,
    faLink,
    faTimes
} from '@fortawesome/free-solid-svg-icons'

type Props = {
    initial?: any
    churchId?: string | number
    onSaved?: (rec: any) => void
}

export default function ReconciliationForm({ initial = {}, churchId, onSaved }: Props) {
    const [form, setForm] = useState<any>({
        payment_id: initial.payment_id ?? null,
        statement_reference: initial.statement_reference ?? '',
        statement_date: initial.statement_date ?? '',
        statement_amount: initial.statement_amount ?? '',
        notes: initial.notes ?? null,
        status: initial.status ?? 'pending',
        church_id: initial.church_id ?? churchId ?? '',
    })
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<any>(null)
    const [selectedPayment, setSelectedPayment] = useState<any>(initial.payment ?? null)

    function onChange(e: any) {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    async function handleSelectPayment(p: any) {
        setSelectedPayment(p)
        setForm(prev => ({ ...prev, payment_id: p?.id, statement_amount: prev.statement_amount || p?.amount }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                payment_id: form.payment_id,
                church_id: form.church_id,
                statement_reference: form.statement_reference || null,
                statement_date: form.statement_date || null,
                statement_amount: form.statement_amount ? Number(form.statement_amount) : null,
                notes: form.notes ? (typeof form.notes === 'string' ? { text: form.notes } : form.notes) : null,
                status: form.status,
            }

            let res
            if (initial?.id) {
                res = await updateReconciliation(initial.id, payload)
            } else {
                res = await createReconciliation(payload)
            }
            onSaved?.(res?.data ?? res)
            setToast({ show: true, message: 'Reconciliation saved successfully!', type: 'success' })
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to save reconciliation', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Header */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/50">
                <FontAwesomeIcon icon={faFileInvoice} className="text-blue-500 text-xl" />
                <div>
                    <div className="font-semibold text-blue-900 dark:text-blue-100">
                        {initial?.id ? 'Edit Reconciliation' : 'New Reconciliation Details'}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        {initial?.id ? 'Update reconciliation information' : 'Create a new bank statement reconciliation'}
                    </div>
                </div>
            </div>

            {/* Payment Selection */}
            <div className="bg-white/50 dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faLink} className="text-purple-500" />
                    Associated Payment (Optional)
                </label>
                <PaymentTypeahead churchId={churchId} onSelect={handleSelectPayment} value={selectedPayment} />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Link this reconciliation to an existing payment for easier tracking
                </div>
            </div>

            {/* Statement Details */}
            <div className="bg-white/50 dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faFileInvoice} className="text-green-500" />
                    Statement Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFileInvoice} className="text-gray-500 text-sm" />
                            Statement Reference
                        </label>
                        <input
                            name="statement_reference"
                            value={form.statement_reference}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="Bank reference number..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendar} className="text-gray-500 text-sm" />
                            Statement Date
                        </label>
                        <input
                            name="statement_date"
                            type="date"
                            value={form.statement_date ?? ''}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500 text-sm" />
                        Statement Amount
                    </label>
                    <input
                        name="statement_amount"
                        type="number"
                        step="0.01"
                        value={form.statement_amount ?? ''}
                        onChange={onChange}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="0.00"
                    />
                </div>
            </div>

            {/* Notes and Status */}
            <div className="bg-white/50 dark:bg-gray-700/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faFileAlt} className="text-gray-500" />
                    Additional Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={onChange}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                        >
                            <option value="pending">Pending</option>
                            <option value="reconciled">Reconciled</option>
                            <option value="unmatched">Unmatched</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFileAlt} className="text-gray-500 text-sm" />
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={typeof form.notes === 'string' ? form.notes : (form.notes?.text ?? '')}
                            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 bg-white/50 dark:bg-gray-600/50 border border-gray-200/50 dark:border-gray-500/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                            placeholder="Additional notes about this reconciliation..."
                        />
                    </div>
                </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => onSaved?.(null)}
                    className="px-6 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 font-medium"
                >
                    Cancel
                </button>
                <button
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg font-medium"
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faSave} />
                            {initial?.id ? 'Update Reconciliation' : 'Create Reconciliation'}
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