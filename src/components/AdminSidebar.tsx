'use client'
import React, { useMemo, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faTachometerAlt,
    faChurch,
    faUsers,
    faMoneyBillWave,
    faCalendar,
    faCog,
    faUserShield,
    faSignOutAlt,
    faTimes,
    faHome,
    faUserTie,
    faBuilding,
    faShieldAlt,
    faGripLinesVertical,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons'
import { useAdminAuth } from '@/hooks/useAdminAuth'

type NavItem = { href: string; label: string; section?: string; icon: unknown }

interface AdminSidebarProps {
    isOpen: boolean
    width: number
    onClose: () => void
    onLogout: () => void
}

export default function AdminSidebar({ isOpen, width, onClose, onLogout }: AdminSidebarProps) {
    const pathname = usePathname()
    const { user } = useAdminAuth()
    const sidebarRef = useRef<HTMLDivElement>(null)

    const nav = useMemo<NavItem[]>(() => {
        if (!user) return []

        const churchAdminOnly: NavItem[] = [
            { href: '/admin/church/members', label: 'Members', section: 'church', icon: faUsers },
            { href: '/admin/church/departments', label: 'Departments', section: 'church', icon: faBuilding },
            { href: '/admin/church/designations', label: 'Designations', section: 'church', icon: faUserTie },
            { href: '/admin/church/finance', label: 'Finance', section: 'church', icon: faMoneyBillWave },
            { href: '/admin/church/finance/reconciliations', label: 'Reconciliation', section: 'church', icon: faShieldAlt },
            { href: '/admin/church/assets', label: 'Assets', section: 'church', icon: faBuilding },
            { href: '/admin/church/ministers', label: 'Ministers', section: 'church', icon: faUserTie },
            { href: '/admin/church/events', label: 'Events', section: 'church', icon: faCalendar },
            { href: '/admin/church/settings', label: 'Settings', section: 'church', icon: faCog },
        ]

        const superadminOnly: NavItem[] = [
            { href: '/admin', label: 'Dashboard', section: 'main', icon: faTachometerAlt },
            { href: '/admin/churches', label: 'Churches', section: 'main', icon: faChurch },
            { href: '/admin/members', label: 'Members', section: 'main', icon: faUsers },
            { href: '/admin/ministers', label: 'Ministers', section: 'main', icon: faUserTie },
            { href: '/admin/finance', label: 'Finance', section: 'main', icon: faMoneyBillWave },
            { href: '/admin/events', label: 'Events', section: 'main', icon: faCalendar },
            { href: '/admin/users', label: 'Users', section: 'admin', icon: faUserShield },
            { href: '/admin/roles', label: 'Roles', section: 'admin', icon: faShieldAlt },
            { href: '/admin/settings', label: 'Settings', section: 'admin', icon: faCog },
        ]

        let navItems: NavItem[] = []

        if (user.role === 'church_admin' && user.church_id) {
            navItems = [
                { href: `/admin/church`, label: 'My Church', section: 'church', icon: faHome },
                ...churchAdminOnly
            ]
        } else if (user.role === 'church_admin') {
            navItems = [
                { href: `/admin/church`, label: 'My Church', section: 'church', icon: faHome },
                ...churchAdminOnly
            ]
        } else if (user.role === 'superadmin') {
            navItems = [...superadminOnly]
        }

        // Remove duplicates by href
        const map = new Map<string, NavItem>()
        for (const it of navItems) {
            if (!map.has(it.href)) map.set(it.href, it)
        }
        return Array.from(map.values())
    }, [user])

    // Fix double dashboard issue - ensure unique active states
    const getActiveState = (item: NavItem) => {
        if (item.href === '/admin') {
            return pathname === '/admin'
        }
        if (item.href === '/admin/church') {
            return pathname === '/admin/church' || pathname.startsWith('/admin/church/')
        }
        return pathname === item.href || pathname.startsWith(item.href + '/')
    }

    if (!user) return null

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Full Sidebar - Only shown when open on desktop */}
            {isOpen && (
                <aside
                    ref={sidebarRef}
                    className={`
                        hidden md:flex h-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-r border-gray-200/50 
                        dark:border-gray-700/50 overflow-y-auto flex flex-col shadow-2xl
                        fixed inset-y-0 left-0 z-30
                    `}
                    style={{ width: `${width}px` }}
                >
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6">
                                {/* Header */}
                                <div className="mb-8 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <span className="text-white font-bold text-lg">P</span>
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                                                PCOF Admin
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Management Portal</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>

                                {/* User Profile Card */}
                                <div className="mb-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <span className="text-white font-bold text-lg">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {user.name}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                                {user.email}
                                            </div>
                                            {user.role && (
                                                <div className="mt-1">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation */}
                                <nav className="space-y-2">
                                    {nav.map((item) => {
                                        const active = getActiveState(item)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${active
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-md'
                                                    }`}
                                                onClick={() => {
                                                    if (window.innerWidth < 768) {
                                                        onClose()
                                                    }
                                                }}
                                            >
                                                <FontAwesomeIcon
                                                    icon={item.icon}
                                                    className={`text-lg transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                                                        }`}
                                                />
                                                <span className="font-medium">
                                                    {item.label}
                                                </span>
                                                {active && (
                                                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                                                )}
                                            </Link>
                                        )
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Fixed Footer with Logout */}
                        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 mt-auto">
                            <div className="p-6">
                                <button
                                    onClick={onLogout}
                                    className="flex items-center gap-4 w-full p-3 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 group"
                                >
                                    <FontAwesomeIcon
                                        icon={faSignOutAlt}
                                        className="text-lg group-hover:scale-110 transition-transform duration-200"
                                    />
                                    <span className="font-medium">
                                        Sign Out
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Toggle Handle */}
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-40">
                        <button
                            onClick={() => onClose()}
                            className="w-6 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-r-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 group"
                        >
                            <FontAwesomeIcon
                                icon={faChevronRight}
                                className="text-white text-xs group-hover:scale-110 transition-transform duration-200"
                            />
                        </button>
                    </div>
                </aside>
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`
                    md:hidden h-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-r border-gray-200/50 
                    dark:border-gray-700/50 overflow-y-auto flex flex-col shadow-2xl
                    fixed inset-y-0 left-0 z-30 transform transition-transform duration-300
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                style={{ width: `${width}px` }}
            >
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            {/* Mobile Header */}
                            <div className="mb-8 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-lg">P</span>
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            PCOF Admin
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Management Portal</div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* User Profile Card */}
                            <div className="mb-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-lg">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {user.name}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                            {user.email}
                                        </div>
                                        {user.role && (
                                            <div className="mt-1">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                                                    {user.role.replace('_', ' ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-2">
                                {nav.map((item) => {
                                    const active = getActiveState(item)
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${active
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                                : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-md'
                                                }`}
                                            onClick={() => onClose()}
                                        >
                                            <FontAwesomeIcon
                                                icon={item.icon}
                                                className={`text-lg transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                                                    }`}
                                            />
                                            <span className="font-medium">
                                                {item.label}
                                            </span>
                                            {active && (
                                                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                                            )}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Fixed Footer with Logout */}
                    <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 mt-auto">
                        <div className="p-6">
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-4 w-full p-3 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 group"
                            >
                                <FontAwesomeIcon
                                    icon={faSignOutAlt}
                                    className="text-lg group-hover:scale-110 transition-transform duration-200"
                                />
                                <span className="font-medium">
                                    Sign Out
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Desktop Mini Sidebar when closed - WITH HOVER TOOLTIPS */}
            {!isOpen && (
                <aside className="hidden md:block fixed inset-y-0 left-0 z-30 w-16 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl hover:w-64 transition-all duration-300 group">
                    <div className="flex flex-col items-start h-full overflow-hidden min-h-0">
                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto w-full">
                            <div className="p-4">
                                {/* Logo */}
                                <div className="mb-8 flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                        <span className="text-white font-bold text-lg">P</span>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                        <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            PCOF Admin
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Management Portal</div>
                                    </div>
                                </div>

                                {/* User Profile - Hidden by default, shows on hover */}
                                <div className="mb-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                            <span className="text-white font-bold text-lg">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {user.name}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                                                {user.email}
                                            </div>
                                            {user.role && (
                                                <div className="mt-1">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 capitalize">
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Icons with hover labels */}
                                <nav className="space-y-2">
                                    {nav.map((item) => {
                                        const active = getActiveState(item)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group w-full ${active
                                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-md'
                                                    }`}
                                            >
                                                <FontAwesomeIcon
                                                    icon={item.icon}
                                                    className={`text-lg transition-transform duration-200 group-hover:scale-110 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                                                        }`}
                                                />
                                                <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                                    {item.label}
                                                </span>
                                                {active && (
                                                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                )}
                                            </Link>
                                        )
                                    })}
                                </nav>
                            </div>
                        </div>

                        {/* Fixed Footer with Logout */}
                        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 mt-auto w-full">
                            <div className="p-4">
                                <button
                                    onClick={onLogout}
                                    className="flex items-center gap-4 w-full p-3 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 group"
                                >
                                    <FontAwesomeIcon
                                        icon={faSignOutAlt}
                                        className="text-lg group-hover:scale-110 transition-transform duration-200 flex-shrink-0"
                                    />
                                    <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                                        Sign Out
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Toggle Handle - Always visible */}
                    <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-40">
                        <button
                            onClick={() => onClose()}
                            className="w-6 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-r-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 group"
                        >
                            <FontAwesomeIcon
                                icon={faGripLinesVertical}
                                className="text-white text-xs group-hover:scale-110 transition-transform duration-200"
                            />
                        </button>
                    </div>
                </aside>
            )}
        </>
    )
}