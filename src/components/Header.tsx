// components/Header.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

const navItems = [
    { href: '/', label: 'Home' },
    { href: '/churches', label: 'Churches' },
    { href: '/events', label: 'Events' },
    { href: '/sermons', label: 'Sermons' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/admin', label: 'Admin' },
]

export default function Header() {
    const [open, setOpen] = useState(false)

    return (
        <header className="bg-white border-b shadow-sm">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Left: logo + brand */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-3">
                            {/* Logo image: put a file at /public/logo.png or change src */}
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-sky-100 flex-shrink-0">
                                <Image
                                    src="/pcof.jpeg"
                                    alt="PCOF logo"
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                />
                            </div>

                            <div className="flex flex-col leading-tight">
                                <span className="text-lg font-semibold text-slate-900">PCOF</span>
                                <span className="text-xs text-slate-500 -mt-0.5">Pentecostal Church One Faith</span>
                            </div>
                        </Link>
                    </div>

                    {/* Middle / Desktop Nav */}
                    <nav className="hidden md:flex items-center space-x-4" aria-label="Primary">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-sm text-slate-700 hover:text-sky-600 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-sky-300"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right: CTA + Mobile hamburger */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/donate"
                            className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg font-medium shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                        >
                            Donate
                        </Link>

                        {/* Mobile menu button */}
                        <button
                            type="button"
                            aria-label="Toggle menu"
                            aria-expanded={open}
                            onClick={() => setOpen((v) => !v)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:bg-slate-100 md:hidden focus:outline-none focus:ring-2 focus:ring-sky-300"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {open ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu (collapsible) */}
            <div
                className={`md:hidden border-t bg-white transition-max-h duration-200 overflow-hidden ${open ? 'max-h-[400px] py-3' : 'max-h-0'}`}
                role="region"
                aria-hidden={!open}
            >
                <div className="container mx-auto px-4 flex flex-col gap-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="block px-3 py-2 rounded text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
                        >
                            {item.label}
                        </Link>
                    ))}

                    <div className="pt-2">
                        <Link
                            href="/donate"
                            onClick={() => setOpen(false)}
                            className="block w-full text-center px-4 py-2 bg-sky-600 text-white rounded-lg font-medium"
                        >
                            Donate
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}
