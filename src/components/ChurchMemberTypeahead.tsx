'use client'
import React, { useEffect, useState } from 'react'
import { searchMembers } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faSearch,
    faUser,
    faSpinner,
    faTimes,
    faIdCard,
    faPhone,
    faChurch,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons'

type Props = { churchId?: string | number; onSelect: (m: unknown) => void; value?: unknown }

export default function MemberTypeahead({ churchId, onSelect, value }: Props) {
    const [q, setQ] = useState('')
    const [list, setList] = useState<unknown[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedMember, setSelectedMember] = useState<unknown>(value)

    useEffect(() => {
        setSelectedMember(value)
    }, [value])

    useEffect(() => {
        let mounted = true
        async function load() {
            if (!mounted) return
            setLoading(true)
            try {
                const res = await searchMembers(q, 10)
                if (mounted) {
                    setList(res)
                    setIsOpen(true)
                }
            } catch (err) {
                if (mounted) setList([])
            } finally { if (mounted) setLoading(false) }
        }

        if (q.trim().length >= 2) {
            const t = setTimeout(load, 300)
            return () => { clearTimeout(t) }
        } else {
            setList([])
            setIsOpen(false)
        }

        return () => { mounted = false }
    }, [q])

    const handleSelect = (member: unknown) => {
        onSelect(member)
        setSelectedMember(member)
        setQ('')
        setIsOpen(false)
    }

    const clearSelection = () => {
        onSelect(null)
        setSelectedMember(null)
        setQ('')
    }

    const getInitials = (member: unknown) => {
        const firstName = member.first_name || ''
        const lastName = member.last_name || ''
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'M'
    }

    const getFullName = (member: unknown) => {
        return [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Unnamed Member'
    }

    return (
        <div className="relative">
            {/* Search Input */}
            <div className="relative">
                <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Search members by name, member number, or phone..."
                    className="w-full pl-12 pr-12 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
                    onFocus={() => list.length > 0 && setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                />
                {(q || selectedMember) && (
                    <button
                        onClick={clearSelection}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl max-h-80 overflow-auto">
                    {loading ? (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg mb-3 text-blue-500" />
                            <div className="text-sm">Searching members...</div>
                        </div>
                    ) : list.length > 0 ? (
                        <div className="py-2">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    Found {list.length} member{list.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                            {list.map(member => (
                                <button
                                    key={member.id}
                                    onClick={() => handleSelect(member)}
                                    className="w-full text-left p-4 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                            {getInitials(member)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                {getFullName(member)}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {member.member_number && (
                                                    <div className="flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faIdCard} className="text-xs opacity-70" />
                                                        <span>#{member.member_number}</span>
                                                    </div>
                                                )}
                                                {member.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faPhone} className="text-xs opacity-70" />
                                                        <span>{member.phone}</span>
                                                    </div>
                                                )}
                                                {member.church_name && (
                                                    <div className="flex items-center gap-2">
                                                        <FontAwesomeIcon icon={faChurch} className="text-xs opacity-70" />
                                                        <span className="truncate">{member.church_name}</span>
                                                    </div>
                                                )}
                                                {!member.member_number && !member.phone && (
                                                    <span>ID: {member.id}</span>
                                                )}
                                            </div>
                                        </div>
                                        <FontAwesomeIcon
                                            icon={faCheckCircle}
                                            className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg"
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : q.trim().length >= 2 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <FontAwesomeIcon icon={faUser} className="text-3xl mb-3 opacity-30" />
                            <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">No members found</div>
                            <div className="text-sm">No results for &aquot;{q}&aquot;</div>
                        </div>
                    ) : null}
                </div>
            )}

            {/* Selected Member Display */}
            {selectedMember && !q && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-700/50 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {getInitials(selectedMember)}
                            </div>
                            <div>
                                <div className="font-semibold text-green-900 dark:text-green-100 text-lg">
                                    {getFullName(selectedMember)}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-green-700 dark:text-green-300 mt-1">
                                    {selectedMember.member_number && (
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faIdCard} className="text-xs" />
                                            <span>#{selectedMember.member_number}</span>
                                        </div>
                                    )}
                                    {selectedMember.phone && (
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faPhone} className="text-xs" />
                                            <span>{selectedMember.phone}</span>
                                        </div>
                                    )}
                                    {selectedMember.church_name && (
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faChurch} className="text-xs" />
                                            <span>{selectedMember.church_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={clearSelection}
                            className="p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30"
                        >
                            <FontAwesomeIcon icon={faTimes} className="text-lg" />
                        </button>
                    </div>
                </div>
            )}

            {/* Instruction Text */}
            {!selectedMember && !q && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <FontAwesomeIcon icon={faSearch} className="text-xs" />
                    Start typing to search for members (min. 2 characters)
                </div>
            )}
        </div>
    )
}