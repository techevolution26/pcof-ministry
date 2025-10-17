'use client'
import React, { useEffect, useState } from 'react'
import { fetchEvents } from '@/lib/adminApi'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faCalendar,
  faSpinner,
  faTimes,
  faChurch,
  faGlobe,
  faMapMarkerAlt,
  faCheckCircle,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons'

type Props = { churchId?: string | number; onSelect: (e: unknown) => void; value?: unknown; placeholder?: string }

export default function EventTypeahead({ churchId, onSelect, value, placeholder = "Search events by title, location, or description..." }: Props) {
  const [q, setQ] = useState('')
  const [suggestions, setSuggestions] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<unknown>(value)

  useEffect(() => {
    setSelectedEvent(value)
  }, [value])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!mounted) return
      setLoading(true)
      try {
        const res = await fetchEvents({ q, church_id: churchId ?? undefined, per_page: 10 })
        const list = Array.isArray(res) ? res : (res?.data ?? [])
        if (mounted) {
          setSuggestions(list)
          setIsOpen(true)
        }
      } catch (err) {
        if (mounted) setSuggestions([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (q.trim().length >= 2) {
      const t = setTimeout(load, 300)
      return () => { clearTimeout(t) }
    } else {
      setSuggestions([])
      setIsOpen(false)
    }

    return () => { mounted = false }
  }, [q, churchId])

  const handleSelect = (event: unknown) => {
    onSelect(event)
    setSelectedEvent(event)
    setQ('')
    setIsOpen(false)
  }

  const clearSelection = () => {
    onSelect(null)
    setSelectedEvent(null)
    setQ('')
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventScope = (event: unknown) => {
    return event.scope ?? (event.church_id ? 'church' : 'national')
  }

  const getScopeIcon = (scope: string) => {
    return scope === 'national' ? faGlobe : faChurch
  }

  const getScopeColor = (scope: string) => {
    return scope === 'national'
      ? 'text-purple-600 dark:text-purple-400'
      : 'text-blue-600 dark:text-blue-400'
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
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        {(q || selectedEvent) && (
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
              <div className="text-sm">Searching events...</div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Found {suggestions.length} event{suggestions.length !== 1 ? 's' : ''}
                </div>
              </div>
              {suggestions.map(event => {
                const scope = getEventScope(event)
                return (
                  <button
                    key={event.id}
                    onClick={() => handleSelect(event)}
                    className="w-full text-left p-4 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                        <FontAwesomeIcon icon={faCalendar} className="text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {event.title || `Event #${event.id}`}
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getScopeColor(scope)} bg-opacity-10`}>
                            <FontAwesomeIcon icon={getScopeIcon(scope)} className="text-xs" />
                            {scope}
                          </span>
                        </div>

                        {event.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {event.description}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {event.starts_at && (
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faCalendarAlt} className="text-xs opacity-70" />
                              <span>{formatDate(event.starts_at)}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs opacity-70" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          {event.church_name && (
                            <div className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faChurch} className="text-xs opacity-70" />
                              <span className="truncate">{event.church_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg mt-1"
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : q.trim().length >= 2 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <FontAwesomeIcon icon={faCalendar} className="text-3xl mb-3 opacity-30" />
              <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">No events found</div>
              <div className="text-sm">No results for &aquot;{q}&aquot;</div>
            </div>
          ) : null}
        </div>
      )}

      {/* Selected Event Display */}
      {selectedEvent && !q && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <FontAwesomeIcon icon={faCalendar} className="text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-blue-900 dark:text-blue-100 text-lg">
                    {selectedEvent.title || `Event #${selectedEvent.id}`}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getScopeColor(getEventScope(selectedEvent))}`}>
                    <FontAwesomeIcon icon={getScopeIcon(getEventScope(selectedEvent))} className="text-xs" />
                    {getEventScope(selectedEvent)}
                  </span>
                </div>

                {selectedEvent.description && (
                  <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    {selectedEvent.description}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 text-sm text-blue-600 dark:text-blue-400">
                  {selectedEvent.starts_at && (
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                      <span>{formatDate(selectedEvent.starts_at)}</span>
                    </div>
                  )}
                  {selectedEvent.location && (
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                  {selectedEvent.church_name && (
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faChurch} className="text-xs" />
                      <span>{selectedEvent.church_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <FontAwesomeIcon icon={faTimes} className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* Instruction Text */}
      {!selectedEvent && !q && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <FontAwesomeIcon icon={faSearch} className="text-xs" />
          Start typing to search for events (min. 2 characters)
        </div>
      )}
    </div>
  )
}