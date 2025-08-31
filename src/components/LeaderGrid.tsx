// src/components/LeaderGrid.tsx
'use client'
import React, { useMemo, useState } from 'react'
import LeaderCard from '@/components/LeaderCard'

type Leader = {
    id: string
    name: string
    title?: string
    role?: string
    photoUrl?: string
    email?: string
    phone?: string
    bio?: string
    startedAt?: string
    slug?: string
}

const chunk = <T,>(arr: T[], size: number) => {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
}

const LeaderGrid = ({ initialLeadership = [], perPage = 3 }: { initialLeadership?: Leader[]; perPage?: number }) => {
    const leaders = Array.isArray(initialLeadership) ? initialLeadership : []
    const pages = useMemo(() => chunk(leaders, perPage), [leaders, perPage])
    const [page, setPage] = useState(0)

    const totalPages = Math.max(1, pages.length)
    const current = pages[page] ?? []

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list" aria-live="polite">
                {current.length === 0 ? (
                    <div className="col-span-3 p-6 bg-green-50 rounded-2xl text-center text-slate-600">
                        No leadership profiles available.
                    </div>
                ) : (
                    current.map((l) => (
                        <div key={l.id} role="listitem">
                            <LeaderCard leader={l} />
                        </div>
                    ))
                )}
            </div>

            {pages.length > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-green-50 transition-colors flex items-center gap-1"
                            aria-label="Previous leaders"
                        >
                            <span>⬅️</span> Previous
                        </button>

                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-green-50 transition-colors flex items-center gap-1"
                            aria-label="Next leaders"
                        >
                            Next <span>➡️</span>
                        </button>
                    </div>

                    <div className="text-sm text-slate-600 bg-green-50 px-3 py-2 rounded-lg" aria-live="polite" aria-atomic="true">
                        {leaders.length === 0 ? '0 of 0' : `${page + 1} of ${totalPages}`}
                    </div>
                </div>
            )}
        </div>
    )
}

export default LeaderGrid