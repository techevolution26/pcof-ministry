// src/components/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
    { href: '/admin', label: 'Dashboard', emoji: '🏠' },
    { href: '/admin/churches', label: 'Churches', emoji: '⛪' },
    { href: '/admin/members', label: 'Members', emoji: '👥' },
    { href: '/admin/departments', label: 'Departments', emoji: '🏷️' },
    { href: '/admin/events', label: 'Events', emoji: '📅' },
    { href: '/admin/finance', label: 'Finance', emoji: '💰' },
    { href: '/admin/assets', label: 'Assets', emoji: '🧾' },
    { href: '/admin/reports', label: 'Reports', emoji: '📊' },
]

export default function AdminSidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 hidden md:block border-r border-slate-100 bg-white h-screen sticky top-0">
            <div className="p-4 border-b border-slate-100">
                <div className="font-semibold text-lg">Admin</div>
                <div className="text-xs text-slate-500 mt-1">PCOF management</div>
            </div>

            <nav className="p-3 space-y-1">
                {items.map(i => {
                    const active = pathname === i.href || (i.href !== '/admin' && pathname?.startsWith(i.href))
                    return (
                        <Link key={i.href} href={i.href} className={`flex items-center gap-3 px-3 py-2 rounded-md ${active ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                            <span className="text-lg">{i.emoji}</span>
                            <span className="text-sm font-medium">{i.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
