'use client'
import React, { useMemo, useState } from 'react'

type MiniEvent = { id: any; title: string; starts_at?: string; ends_at?: string }

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate()+n); return c }

export default function EventCalendar({ events }: { events: MiniEvent[] }) {
  const [date, setDate] = useState(() => new Date())

  const { weeks, monthLabel } = useMemo(() => {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    // backtrack to previous sunday (or Monday if you prefer)
    const startGrid = addDays(start, -start.getDay())
    const totalDays = Math.ceil((end.getTime() - startGrid.getTime()) / (24*60*60*1000)) + 1
    const days = Array.from({ length: Math.ceil(totalDays / 7) * 7 }).map((_, idx) => addDays(startGrid, idx))
    const weeks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i+7))
    const monthLabel = start.toLocaleString(undefined, { month: 'long', year: 'numeric' })
    return { weeks, monthLabel }
  }, [date])

  // group events by local date string 'YYYY-MM-DD'
  const eventsByDate = useMemo(() => {
    const map = new Map<string, MiniEvent[]>()
    for (const e of events || []) {
      if (!e.starts_at) continue
      const d = new Date(e.starts_at)
      const key = d.toISOString().slice(0,10)
      const arr = map.get(key) ?? []
      arr.push(e)
      map.set(key, arr)
    }
    return map
  }, [events])

  function prevMonth() { setDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1)) }
  function nextMonth() { setDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1)) }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">{monthLabel}</div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="px-2 py-1 border rounded">Prev</button>
          <button onClick={nextMonth} className="px-2 py-1 border rounded">Next</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-xs text-gray-500 text-center">{d}</div>
        ))}

        {weeks.flat().map(day => {
          const key = day.toISOString().slice(0,10)
          const isCurrentMonth = day.getMonth() === date.getMonth()
          const evs = eventsByDate.get(key) ?? []
          return (
            <div key={key} className={`min-h-[90px] border p-2 ${isCurrentMonth ? '' : 'bg-gray-50 text-gray-400'}`}>
              <div className="text-sm font-medium">{day.getDate()}</div>
              <ul className="mt-1 space-y-1">
                {evs.slice(0,3).map(ev => (
                  <li key={ev.id} className="text-xs truncate">
                    {ev.title}
                  </li>
                ))}
                {evs.length > 3 && <li className="text-xs text-gray-500">+{evs.length - 3} more</li>}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
