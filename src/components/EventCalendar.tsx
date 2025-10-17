'use client'
import React, { useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

type MiniEvent = { id: unknown; title: string; starts_at?: string; ends_at?: string }

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate() + n); return c }

export default function EventCalendar({ events }: { events: MiniEvent[] }) {
  const [date, setDate] = useState(() => new Date())

  const { weeks, monthLabel } = useMemo(() => {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    const startGrid = addDays(start, -start.getDay())
    const totalDays = Math.ceil((end.getTime() - startGrid.getTime()) / (24 * 60 * 60 * 1000)) + 1
    const days = Array.from({ length: Math.ceil(totalDays / 7) * 7 }).map((_, idx) => addDays(startGrid, idx))
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
    const monthLabel = start.toLocaleString(undefined, { month: 'long', year: 'numeric' })
    return { weeks, monthLabel }
  }, [date])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, MiniEvent[]>()
    for (const e of events || []) {
      if (!e.starts_at) continue
      const d = new Date(e.starts_at)
      const key = d.toISOString().slice(0, 10)
      const arr = map.get(key) ?? []
      arr.push(e)
      map.set(key, arr)
    }
    return map
  }, [events])

  function prevMonth() { setDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  function nextMonth() { setDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }

  return (
    <div className="bg-transparent">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-xl font-bold text-gray-900 dark:text-white">
          {monthLabel}
        </div>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="w-10 h-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-gray-600 dark:text-gray-300 text-sm" />
          </button>
          <button
            onClick={nextMonth}
            className="w-10 h-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
          >
            <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 dark:text-gray-300 text-sm" />
          </button>
        </div>
      </div>

      {/* Enhanced Calendar Grid */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="bg-gray-50 dark:bg-gray-800 p-3 text-center">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">{d}</div>
            </div>
          ))}

          {weeks.flat().map(day => {
            const key = day.toISOString().slice(0, 10)
            const isCurrentMonth = day.getMonth() === date.getMonth()
            const isToday = day.toDateString() === new Date().toDateString()
            const evs = eventsByDate.get(key) ?? []

            return (
              <div
                key={key}
                className={`min-h-[100px] p-2 transition-colors duration-200 ${isCurrentMonth
                    ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                    : 'bg-gray-50/50 dark:bg-gray-900/50 text-gray-400'
                  } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday
                    ? 'text-blue-600 dark:text-blue-400'
                    : isCurrentMonth
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400'
                  }`}>
                  {day.getDate()}
                </div>

                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {evs.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-lg truncate hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors cursor-pointer"
                    >
                      {ev.title}
                    </div>
                  ))}
                  {evs.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                      +{evs.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
          <span>Events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 ring-2 ring-blue-500 rounded"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}