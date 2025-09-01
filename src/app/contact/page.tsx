// app/contact/page.tsx
import ContactForm from '@/components/ContactForm'
import Link from 'next/link'

export const revalidate = 3600

export default function ContactPage() {
    return (
        <section className="py-12">
            <div className="container mx-auto px-4">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-bold text-slate-800 mb-4 flex items-center justify-center gap-2">
                        <span className="text-sky-600">📞</span> Contact PCOF
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        We'd love to hear from you — whether you're asking about a local church, an event, volunteering or how to partner with us.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <main className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
                            <ContactForm />
                        </div>
                    </main>

                    <aside className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="text-sky-600">🏢</span> Office
                            </h3>
                            <div className="space-y-3 text-slate-700">
                                <p className="flex items-start gap-2">
                                    <span className="text-sky-600 mt-1">📍</span>
                                    PCOF Headquarters<br />
                                    B8 Kilifi-Malindi Road<br />
                                    Matsangoni, Kenya
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-sky-600 mt-1">✉️</span>
                                    Email: <a href="mailto:office@pcof.org" className="text-sky-600 hover:text-sky-700 underline">office@pcof.org</a>
                                </p>
                                <p className="flex items-start gap-2">
                                    <span className="text-sky-600 mt-1">📱</span>
                                    Phone: <a href="tel:+254700000000" className="text-sky-600 hover:text-sky-700 underline">+254 700 000 000</a>
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="text-sky-600">⏰</span> Office hours
                            </h3>
                            <div className="space-y-2 text-slate-700">
                                <p className="flex items-center gap-2">
                                    <span className="text-sky-600">📅</span> Mon — Fri: 9:00 — 17:00 EAT
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-sky-600">📅</span> Sat: 9:00 — 13:00 EAT
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="text-sky-600">🚫</span> Sun: Closed
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-5 border border-green-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="text-sky-600">🌐</span> Follow us
                            </h3>
                            <div className="flex flex-col gap-3">
                                <a href="#" className="text-sky-600 hover:text-sky-700 flex items-center gap-2">
                                    <span className="text-lg">📘</span> Facebook
                                </a>
                                <a href="#" className="text-sky-600 hover:text-sky-700 flex items-center gap-2">
                                    <span className="text-lg">📺</span> YouTube
                                </a>
                                <a href="#" className="text-sky-600 hover:text-sky-700 flex items-center gap-2">
                                    <span className="text-lg">🐦</span> Twitter / X
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>

                <div className="mt-12 text-sm text-slate-500 bg-green-50 p-4 rounded-2xl text-center">
                    We aim to respond within 2 business days. This contact form is for general enquiries — for urgent pastoral care please call the office.
                </div>
            </div>
        </section>
    )
}