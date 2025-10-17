'use client'
import React, { useState, useEffect } from 'react'
import { fetchPayments } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSearch,
    faMoneyBillWave,
    faSpinner,
    faTimes,
    faUser,
    faCalendar,
    faCheckCircle,
    faReceipt
} from '@fortawesome/free-solid-svg-icons'

type Props = { churchId?: string | number; onSelect: (p: unknown) => void; value?: unknown }

export default function PaymentTypeahead({ churchId, onSelect, value }: Props) {
    const [q, setQ] = useState('')
    const [suggestions, setSuggestions] = useState<unknown[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState<unknown>(value)

    useEffect(() => {
        setSelectedPayment(value)
    }, [value])

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!churchId) {
                setSuggestions([])
                return
            }
            setLoading(true)
            try {
                const res = await fetchPayments({ church_id: churchId, q, per_page: 10 })
                const list = Array.isArray(res) ? res : (res?.data ?? [])
                if (mounted) {
                    setSuggestions(list)
                    setIsOpen(true)
                }
            } catch (err) {
                if (mounted) setSuggestions([])
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (q.trim().length >= 2) {
            const t = setTimeout(load, 300)
            return () => { clearTimeout(t) }
        } else {
            setSuggestions([])
            setIsOpen(false)
        }

        return () => { mounted = false }
    }, [churchId, q])

    const handleSelect = (payment: unknown) => {
        onSelect(payment)
        setSelectedPayment(payment)
        setQ('')
        setIsOpen(false)
    }

    const clearSelection = () => {
        onSelect(null)
        setSelectedPayment(null)
        setQ('')
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'No date'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getPaymentTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'tithe': return 'text-purple-600 dark:text-purple-400'
            case 'offering': return 'text-blue-600 dark:text-blue-400'
            case 'event_fee': return 'text-green-600 dark:text-green-400'
            case 'collection': return 'text-orange-600 dark:text-orange-400'
            default: return 'text-gray-600 dark:text-gray-400'
        }
    }

    const getPaymentStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
            case 'pending': return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30'
            case 'submitted': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
        }
    }

    return (
        <div className="relative">
            {/* Search Input */}
            <div className="relative">
                <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Search payments by reference, member, or type..."
                    className="w-full pl-12 pr-12 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
                    onFocus={() => suggestions.length > 0 && setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                />
                {(q || selectedPayment) && (
                    <button
                        onClick={clearSelection}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl max-h-80 overflow-auto">
                    {loading ? (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg mb-3 text-blue-500" />
                            <div className="text-sm">Searching payments...</div>
                        </div>
                    ) : suggestions.length > 0 ? (
                        <div className="py-2">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    Found {suggestions.length} payment{suggestions.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                            {suggestions.map(payment => (
                                <button
                                    key={payment.id}
                                    onClick={() => handleSelect(payment)}
                                    className="w-full text-left p-4 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-lg" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                    {payment.reference || `Payment #${payment.id}`}
                                                </div>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(payment.status)}`}>
                                                    {payment.status}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                <span className={`capitalize font-medium ${getPaymentTypeColor(payment.type)}`}>
                                                    {payment.type?.replace('_', ' ')}
                                                </span>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {payment.amount} {payment.currency}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                {payment.member && (
                                                    <div className="flex items-center gap-1">
                                                        <FontAwesomeIcon icon={faUser} className="text-xs opacity-70" />
                                                        <span>{payment.member.first_name} {payment.member.last_name}</span>
                                                    </div>
                                                )}
                                                {payment.created_at && (
                                                    <div className="flex items-center gap-1">
                                                        <FontAwesomeIcon icon={faCalendar} className="text-xs opacity-70" />
                                                        <span>{formatDate(payment.created_at)}</span>
                                                    </div>
                                                )}
                                                {payment.event && (
                                                    <div className="flex items-center gap-1">
                                                        <FontAwesomeIcon icon={faCalendar} className="text-xs opacity-70" />
                                                        <span className="truncate">{payment.event.title}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <FontAwesomeIcon
                                            icon={faCheckCircle}
                                            className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg mt-1"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : q.trim().length >= 2 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <FontAwesomeIcon icon={faReceipt} className="text-3xl mb-3 opacity-30" />
                            <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">No payments found</div>
                            <div className="text-sm">No results for &aquot;{q}&aquot;</div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Selected Payment Display */}
            {selectedPayment && !q && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-xl" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="font-semibold text-green-900 dark:text-green-100 text-lg">
                                        {selectedPayment.reference || `Payment #${selectedPayment.id}`}
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(selectedPayment.status)}`}>
                                        {selectedPayment.status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 text-sm text-green-700 dark:text-green-300 mb-2">
                                    <span className={`capitalize font-medium ${getPaymentTypeColor(selectedPayment.type)}`}>
                                        {selectedPayment.type?.replace('_', ' ')}
                                    </span>
                                    <span className="font-semibold">
                                        {selectedPayment.amount} {selectedPayment.currency}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-sm text-green-600 dark:text-green-400">
                                    {selectedPayment.member && (
                                        <div className="flex items-center gap-1">
                                            <FontAwesomeIcon icon={faUser} className="text-xs" />
                                            <span>{selectedPayment.member.first_name} {selectedPayment.member.last_name}</span>
                                        </div>
                                    )}
                                    {selectedPayment.created_at && (
                                        <div className="flex items-center gap-1">
                                            <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                                            <span>{formatDate(selectedPayment.created_at)}</span>
                                        </div>
                                    )}
                                    {selectedPayment.event && (
                                        <div className="flex items-center gap-1">
                                            <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                                            <span>{selectedPayment.event.title}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={clearSelection}
                            className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-lg" />
                        </button>
                    </div>
                </div>
            )}

            {/* Instruction Text */}
            {!selectedPayment && !q && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <FontAwesomeIcon icon={faSearch} className="text-xs" />
                    Start typing to search for payments (min. 2 characters)
                </div>
            )}
        </div>
    )
}