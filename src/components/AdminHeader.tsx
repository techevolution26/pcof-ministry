'use client'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface AdminHeaderProps {
    sidebarOpen: boolean
    onToggleSidebar: () => void
}

export default function AdminHeader({ sidebarOpen, onToggleSidebar }: AdminHeaderProps) {
    const { user } = useAdminAuth()

    return (
        <header className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 h-16 flex items-center px-4 shadow-lg fixed top-0 z-20 md:left-16">
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleSidebar}
                    className="inline-flex items-center justify-center h-12 w-12 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <FontAwesomeIcon
                        icon={sidebarOpen ? faTimes : faBars}
                        className="text-gray-700 dark:text-gray-300 text-lg"
                    />
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        PCOF Admin
                    </div>
                </div>
            </div>

            <div className="ml-auto flex items-center gap-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user?.name}
                </div>
            </div>
        </header>
    )
}