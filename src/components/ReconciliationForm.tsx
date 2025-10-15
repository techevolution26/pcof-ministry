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
    paymentId?: string | number // Add this line to fix the TypeScript error
}

export default function ReconciliationForm({ initial = {}, churchId, onSaved, paymentId }: Props) {
    const [form, setForm] = useState<any>({
        payment_id: initial.payment_id ?? paymentId ?? null, // Use paymentId prop here
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
        setForm(prev => ({
            ...prev,
            payment_id: p?.id,
            statement_amount: prev.statement_amount || p?.amount,
            church_id: prev.church_id || p?.church_id
        }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        // Validate required fields
        if (!form.statement_reference?.trim()) {
            setToast({ show: true, message: 'Statement reference is required', type: 'error' })
            return
        }

        if (!form.statement_amount) {
            setToast({ show: true, message: 'Statement amount is required', type: 'error' })
            return
        }

        setSaving(true)
        try {
            const payload = {
                payment_id: form.payment_id,
                church_id: form.church_id,
                statement_reference: form.statement_reference.trim(),
                statement_date: form.statement_date || null,
                statement_amount: Number(form.statement_amount),
                notes: form.notes ? (typeof form.notes === 'string' ? { text: form.notes } : form.notes) : null,
                status: form.status,
            }

            let res
            if (initial?.id) {
                res = await updateReconciliation(initial.id, payload)
            } else {
                res = await createReconciliation(payload)
            }

            const savedRec = res?.data ?? res
            setToast({ show: true, message: 'Reconciliation saved successfully!', type: 'success' })

            // Reset form if it's a new reconciliation
            if (!initial?.id) {
                setForm({
                    payment_id: paymentId ?? null,
                    statement_reference: '',
                    statement_date: '',
                    statement_amount: '',
                    notes: '',
                    status: 'pending',
                    church_id: churchId ?? '',
                })
                setSelectedPayment(null)
            }

            onSaved?.(savedRec)
        } catch (err: any) {
            console.error(err)
            setToast({ show: true, message: err?.message ?? 'Failed to save reconciliation', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    function handleCancel() {
        // Reset form to initial state
        setForm({
            payment_id: initial.payment_id ?? paymentId ?? null,
            statement_reference: initial.statement_reference ?? '',
            statement_date: initial.statement_date ?? '',
            statement_amount: initial.statement_amount ?? '',
            notes: initial.notes ?? null,
            status: initial.status ?? 'pending',
            church_id: initial.church_id ?? churchId ?? '',
        })
        setSelectedPayment(initial.payment ?? null)
        onSaved?.(null)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form Header */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <FontAwesomeIcon icon={faFileInvoice} className="text-white text-lg" />
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-blue-900 dark:text-blue-100 text-lg">
                        {initial?.id ? 'Edit Reconciliation' : 'New Reconciliation'}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        {initial?.id ? 'Update reconciliation details' : 'Link payment to bank statement'}
                    </div>
                </div>
            </div>

            {/* Payment Selection - Only show if no paymentId provided */}
            {!paymentId && (
                <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <FontAwesomeIcon icon={faLink} className="text-purple-500" />
                        Associated Payment
                    </label>
                    <PaymentTypeahead
                        churchId={form.church_id}
                        onSelect={handleSelectPayment}
                        value={selectedPayment}
                    />
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Search and select a payment to reconcile
                    </div>
                </div>
            )}

            {/* Statement Details */}
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faFileInvoice} className="text-green-500" />
                    Bank Statement Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Statement Reference *
                        </label>
                        <input
                            name="statement_reference"
                            value={form.statement_reference}
                            onChange={onChange}
                            required
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="e.g., BANK-REF-12345"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Statement Date
                        </label>
                        <input
                            name="statement_date"
                            type="date"
                            value={form.statement_date}
                            onChange={onChange}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Statement Amount *
                    </label>
                    <input
                        name="statement_amount"
                        type="number"
                        step="0.01"
                        value={form.statement_amount}
                        onChange={onChange}
                        required
                        className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="0.00"
                    />
                </div>
            </div>

            {/* Notes and Status */}
            <div className="bg-white dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faFileAlt} className="text-gray-500" />
                    Additional Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <select
                            name="status"
                            value={form.status}
                            onChange={onChange}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                        >
                            <option value="pending">Pending</option>
                            <option value="reconciled">Reconciled</option>
                            <option value="unmatched">Unmatched</option>
                            <option value="disputed">Disputed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={typeof form.notes === 'string' ? form.notes : (form.notes?.text ?? '')}
                            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                            placeholder="Additional notes about this reconciliation..."
                        />
                    </div>
                </div>
            </div>

            {/* Summary Card */}
            {(form.payment_id || form.statement_reference) && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                    <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Reconciliation Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {form.payment_id && (
                            <div className="text-green-700 dark:text-green-400">
                                <span className="font-medium">Payment:</span> {selectedPayment?.reference || `ID: ${form.payment_id}`}
                            </div>
                        )}
                        {form.statement_reference && (
                            <div className="text-blue-700 dark:text-blue-400">
                                <span className="font-medium">Bank Ref:</span> {form.statement_reference}
                            </div>
                        )}
                        {form.statement_amount && (
                            <div className="text-purple-700 dark:text-purple-400">
                                <span className="font-medium">Amount:</span> {Number(form.statement_amount).toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </div>
                        )}
                        <div className="text-gray-700 dark:text-gray-400">
                            <span className="font-medium">Status:</span>
                            <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${form.status === 'reconciled' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                form.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                    form.status === 'disputed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                }`}>
                                {form.status}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 transition-all duration-200 font-medium flex items-center gap-2"
                >
                    <FontAwesomeIcon icon={faTimes} />
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving || !form.statement_reference?.trim() || !form.statement_amount}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium"
                >
                    {saving ? (
                        <>
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon icon={faSave} />
                            {initial?.id ? 'Update' : 'Create'} Reconciliation
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