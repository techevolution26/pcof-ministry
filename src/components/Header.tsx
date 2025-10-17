// components/Header.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faBars,
    faTimes,
    faShieldAlt,
    faArrowLeft
} from '@fortawesome/free-solid-svg-icons'

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
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()

    // Fix hydration by only rendering after mount
    useEffect(() => {
        setMounted(true)
    }, [])

    // Function to check if a nav item is active
    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/'
        }
        return pathname.startsWith(href)
    }

    // Check if we're in admin section
    const isAdminSection = pathname?.startsWith('/admin')

    // If we're in admin section AND not on login/register pages, show minimal sticky header
    if (mounted && isAdminSection && !pathname?.includes('/admin/login') && !pathname?.includes('/admin/register')) {
        return (
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 supports-backdrop-blur:bg-white/60 sticky top-0 z-50">
                {/* Added sticky positioning */}
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: Home button with glass morphism */}
                        <Link
                            href="/"
                            className="group flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm border border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50"
                        >
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-sky-500 to-blue-600 flex-shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-lg">
                                <Image
                                    src="/pcof.jpeg"
                                    alt="PCOF logo"
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <FontAwesomeIcon
                                    icon={faArrowLeft}
                                    className="text-sky-600 dark:text-sky-400 text-base group-hover:translate-x-[-2px] transition-transform"
                                />
                                <div className="text-left">
                                    <div className="text-sm font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300">
                                        Return to Site
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Pentecostal Church One Faith
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Right: Admin badge */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500/10 to-blue-600/10 dark:from-sky-500/20 dark:to-blue-600/20 backdrop-blur-sm rounded-2xl border border-sky-200/50 dark:border-sky-700/50">
                                <FontAwesomeIcon
                                    icon={faShieldAlt}
                                    className="text-sky-600 dark:text-sky-400 text-sm"
                                />
                                <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
                                    Admin Dashboard
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        )
    }

    // Regular header for non-admin sections and admin login/register
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
                            <FontAwesomeIcon
                                icon={open ? faTimes : faBars}
                                className="w-5 h-5"
                            />
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