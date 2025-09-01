// components/Header.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

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
    const pathname = usePathname()

    // Function to check if a nav item is active
    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/'
        }
        return pathname.startsWith(href)
    }

    return (
        <header className="bg-white border-b shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Left: logo + brand */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-sky-100 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                                <Image
                                    src="/pcof.jpeg"
                                    alt="PCOF logo"
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                />
                            </div>

                            <div className="flex flex-col leading-tight">
                                <span className="text-lg font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">PCOF</span>
                                <span className="text-xs text-slate-500 -mt-0.5">Pentecostal Church One Faith</span>
                            </div>
                        </Link>
                    </div>

                    {/* Middle / Desktop Nav */}
                    <nav className="hidden md:flex items-center space-x-1" aria-label="Primary">
                        {navItems.map((item) => {
                            const active = isActive(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`text-sm px-3 py-2 rounded-lg font-medium transition-all duration-300 relative ${active
                                            ? 'text-sky-600 bg-sky-50 font-semibold'
                                            : 'text-slate-700 hover:text-sky-600 hover:bg-green-50'
                                        }`}
                                >
                                    {item.label}
                                    {active && (
                                        <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-sky-600 rounded-full"></span>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right: CTA + Mobile hamburger */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/donate"
                            className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg font-medium shadow-md hover:bg-sky-700 transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            <span className="text-lg">💝</span> Donate
                        </Link>

                        {/* Mobile menu button */}
                        <button
                            type="button"
                            aria-label="Toggle menu"
                            aria-expanded={open}
                            onClick={() => setOpen((v) => !v)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:bg-green-50 md:hidden focus:outline-none focus:ring-2 focus:ring-sky-300 transition-colors"
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
                className={`md:hidden border-t bg-white transition-all duration-300 overflow-hidden ${open ? 'max-h-[400px] py-3' : 'max-h-0'}`}
                role="region"
                aria-hidden={!open}
            >
                <div className="container mx-auto px-4 flex flex-col gap-2">
                    {navItems.map((item) => {
                        const active = isActive(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={`block px-4 py-3 rounded-lg transition-colors font-medium relative ${active
                                        ? 'text-sky-600 bg-sky-50 font-semibold'
                                        : 'text-slate-700 hover:bg-green-50'
                                    }`}
                            >
                                {item.label}
                                {active && (
                                    <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-sky-600 rounded-full"></span>
                                )}
                            </Link>
                        )
                    })}

                    <div className="pt-2">
                        <Link
                            href="/donate"
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-center gap-2 w-full text-center px-4 py-3 bg-sky-600 text-white rounded-lg font-medium transition-transform hover:scale-[1.02]"
                        >
                            <span className="text-lg">💝</span> Donate
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}