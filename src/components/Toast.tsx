// src/components/Toast.tsx
'use client'
import React, { useEffect } from 'react'

export type ToastProps = {
    show: boolean
    message?: string
    type?: 'success' | 'error' | 'info'
    duration?: number // ms
    onClose?: () => void
}

export default function Toast({ show, message = '', type = 'success', duration = 3500, onClose }: ToastProps) {
    useEffect(() => {
        if (!show) return
        const t = setTimeout(() => {
            onClose?.()
        }, duration)
        return () => clearTimeout(t)
    }, [show, duration, onClose])

    if (!show) return null

    const bg =
        type === 'success' ? 'bg-emerald-600' :
            type === 'error' ? 'bg-red-600' :
                'bg-sky-600'

    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed right-4 bottom-6 z-50 max-w-xs w-[min(95%,320px)] ${bg} text-white px-4 py-3 rounded-lg shadow-lg`}
        >
            <div className="text-sm">
                {message}
            </div>
        </div>
    )
}
