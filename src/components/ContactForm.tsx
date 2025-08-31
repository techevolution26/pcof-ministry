// components/ContactForm.tsx
'use client'

import React, { useState } from 'react'

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
        church: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate form submission
        try {
            // Replace with actual form submission logic
            await new Promise(resolve => setTimeout(resolve, 1000))
            setSubmitStatus('success')
            setFormData({ name: '', email: '', subject: '', message: '', church: '' })
        } catch (error) {
            setSubmitStatus('error')
        } finally {
            setIsSubmitting(false)
            setTimeout(() => setSubmitStatus('idle'), 3000)
        }
    }

    return (
        <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="text-sky-600">📧</span> Send us a message
            </h2>

            {submitStatus === 'success' && (
                <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <span className="text-lg">✅</span> Message sent successfully! We'll get back to you soon.
                </div>
            )}

            {submitStatus === 'error' && (
                <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <span className="text-lg">❌</span> Something went wrong. Please try again or contact us directly.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
                            placeholder="Your full name"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                            Email Address *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
                            placeholder="your.email@example.com"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
                        Subject *
                    </label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
                        placeholder="What is this regarding?"
                    />
                </div>

                <div>
                    <label htmlFor="church" className="block text-sm font-medium text-slate-700 mb-1">
                        Church (if applicable)
                    </label>
                    <input
                        type="text"
                        id="church"
                        name="church"
                        value={formData.church}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
                        placeholder="Your church name"
                    />
                </div>

                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                        Message *
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:border-sky-300"
                        placeholder="How can we help you?"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            Sending...
                        </>
                    ) : (
                        <>
                            <span>📤</span>
                            Send Message
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}