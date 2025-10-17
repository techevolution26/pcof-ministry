// src/components/AdminEventCard.tsx
'use client'
import React from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendar,
  faMapMarkerAlt,
  faUsers,
  faGlobe,
  faChurch,
  faBuilding,
  faClock,
  faImage,
  faEye,
  faEdit,
  faTrash,
  faSpinner
} from '@fortawesome/free-solid-svg-icons'

type AdminEventCardProps = {
  events: unknown[]
  onDelete?: (id: number) => void
  isDeleting?: boolean
}

export default function AdminEventCard({ events, onDelete, isDeleting = false }: AdminEventCardProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/50 dark:border-gray-700/50">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <FontAwesomeIcon icon={faCalendar} className="text-gray-400 text-lg" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No events available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map(event => {
        const startDate = event.starts_at ? new Date(event.starts_at) : null
        const endDate = event.ends_at ? new Date(event.ends_at) : null

        const formatDate = (date: Date) => {
          return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        }

        const formatTime = (date: Date) => {
          return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        }

        return (
          <div key={event.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-200 hover:shadow-xl hover:translate-y-[-2px]">
            <div className="p-6">
              <div className="flex gap-4">
                {/* Event Image */}
                <div className="flex-shrink-0">
                  {event.image_url || event.image_path ? (
                    <img
                      src={event.image_url ?? event.image_path}
                      alt={event.title}
                      className="w-24 h-24 object-cover rounded-xl shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center shadow-md">
                      <FontAwesomeIcon icon={faImage} className="text-gray-400 text-xl" />
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  {/* Header with Title and Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {event.is_national ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                            <FontAwesomeIcon icon={faGlobe} className="text-xs" />
                            National Event
                          </span>
                        ) : event.church?.name ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                            <FontAwesomeIcon icon={faChurch} className="text-xs" />
                            {event.church.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                            <FontAwesomeIcon icon={faBuilding} className="text-xs" />
                            No Church
                          </span>
                        )}

                        {event.online && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                            <FontAwesomeIcon icon={faGlobe} className="text-xs" />
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  {startDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <FontAwesomeIcon icon={faCalendar} className="text-blue-500" />
                      <span className="font-medium">{formatDate(startDate)}</span>
                      <FontAwesomeIcon icon={faClock} className="text-blue-500 ml-1" />
                      <span>{formatTime(startDate)}</span>
                      {endDate && startDate.toDateString() !== endDate.toDateString() && (
                        <>
                          <span className="mx-1">to</span>
                          <span className="font-medium">{formatDate(endDate)}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}

                  {/* Description Preview */}
                  {event.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                      {event.description}
                    </p>
                  )}

                  {/* Footer with Capacity */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {event.capacity && (
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faUsers} />
                          Capacity: {event.capacity}
                        </span>
                      )}
                      {event.assembly_id && (
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faBuilding} />
                          Assembly Event
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Now integrated into the card */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                    title="View Details"
                  >
                    <FontAwesomeIcon icon={faEye} className="text-sm" />
                  </Link>
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                    title="Edit Event"
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-sm" />
                  </Link>
                </div>

                {onDelete && (
                  <button
                    onClick={() => onDelete(event.id)}
                    disabled={isDeleting}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete Event"
                  >
                    <FontAwesomeIcon
                      icon={isDeleting ? faSpinner : faTrash}
                      className={`text-sm ${isDeleting ? 'animate-spin' : ''}`}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}