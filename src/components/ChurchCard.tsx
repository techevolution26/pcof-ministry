// components/ChurchCard.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function ChurchCard({ church }: { church: any }) {
  return (
    <article className="bg-white rounded-2xl shadow-md p-6 border border-green-100 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-sky-100 flex-shrink-0 flex items-center justify-center">
          {church.logoUrl ? (
            <Image src={church.logoUrl} alt={`${church.name} logo`} width={64} height={64} style={{ objectFit: 'cover' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sky-600 font-semibold text-lg">
              {church.name?.split(' ').map(s => s[0]).slice(0, 2).join('')}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-800">{church.name}</h3>
          <div className="text-sm text-slate-600 mt-1 flex items-center gap-1">
            <span>📍</span> {church.address}
          </div>
          <div className="text-sm text-slate-500 mt-2 flex items-center gap-1">
            <span>👨‍💼</span> Pastor: {church.pastor ?? '—'}
          </div>
        </div>
      </div>

      {church.serviceTimes && (
        <div className="mt-3 text-sm text-slate-600 flex items-center gap-1">
          <span>⏰</span> {church.serviceTimes}
        </div>
      )}

      {church.tags && church.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {church.tags.map((tag: string) => (
            <span key={tag} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 mt-auto flex gap-2 pt-4 border-t border-green-100">
        <Link
          href={`/churches/${church.slug ?? church.id}`}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors flex-1 text-center"
        >
          Visit
        </Link>

        {church.locationUrl ? (
          <a
            href={church.locationUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center gap-1"
          >
            <span>🗺️</span> Map
          </a>
        ) : null}

        {church.phone ? (
          <a
            href={`tel:${church.phone}`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-green-50 transition-colors flex items-center gap-1"
          >
            <span>📞</span> Call
          </a>
        ) : null}
      </div>
    </article>
  )
}