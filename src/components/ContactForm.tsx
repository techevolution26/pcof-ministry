'use client'


import React, { useState } from 'react'


export default function ContactForm() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState<null | { ok: boolean; message: string }>(null)


    // honeypot field for bots
    const [hp, setHp] = useState('')


    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setStatus(null)


        // basic validation
        if (!name.trim() || !email.trim() || !message.trim()) {
            setStatus({ ok: false, message: 'Please complete all required fields.' })
            return
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setStatus({ ok: false, message: 'Please provide a valid email address.' })
            return
        }


        // honeypot should be empty
        if (hp) {
            // silently accept (pretend success) or return error — here, pretend success to avoid revealing honeypot
            setStatus({ ok: true, message: 'Thank you — we will be in touch.' })
            setName(''); setEmail(''); setMessage('')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            })


            const json = await res.json()
            if (!res.ok) throw new Error(json?.message || 'Could not send message')


            setStatus({ ok: true, message: 'Thanks — your message has been sent.' })
            setName(''); setEmail(''); setMessage('')
        } catch (err: any) {
            setStatus({ ok: false, message: err?.message ?? 'An error occurred' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="bg-white border rounded p-4 max-w-lg" aria-label="Contact form">
            <div className="mb-3">
                <label className="text-sm block mb-1">Your name</label>
                <input className="w-full p-2 border rounded" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" required />
            </div>


            <div className="mb-3">
                <label className="text-sm block mb-1">Your email</label>
                <input type="email" className="w-full p-2 border rounded" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>


            <div className="mb-3">
                <label className="text-sm block mb-1">Message</label>
                <textarea className="w-full p-2 border rounded h-32" value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help?" required />
            </div>


            {/* honeypot (hidden from humans) */}
            <div style={{ display: 'none' }} aria-hidden="true">
                <label>Do not fill</label>
                <input name="hp" value={hp} onChange={e => setHp(e.target.value)} />
            </div>


            <div className="flex items-center gap-3">
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded" disabled={submitting}>{submitting ? 'Sending…' : 'Send message'}</button>
                {status && (
                    <div className={`text-sm ${status.ok ? 'text-green-600' : 'text-red-600'}`}>{status.message}</div>
                )}
            </div>
        </form>
    )
}