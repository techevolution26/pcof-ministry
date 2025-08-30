// components/ChurchCard.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function ChurchCard({ church }: { church: any }) {
  return (
    <article className="border rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
          {church.logoUrl ? (
            <Image src={church.logoUrl} alt={`${church.name} logo`} width={64} height={64} style={{ objectFit: 'cover' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
              {church.name?.split(' ').map(s => s[0]).slice(0,2).join('')}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold">{church.name}</h3>
          <div className="text-sm text-slate-600">{church.address}</div>
          <div className="text-sm text-slate-500 mt-1">Pastor: {church.pastor ?? '—'}</div>
        </div>
      </div>

      {church.serviceTimes && (
        <div className="mt-3 text-sm text-slate-600">{church.serviceTimes}</div>
      )}

      <div className="mt-4 mt-auto flex gap-2">
        <Link href={`/churches/${church.slug ?? church.id}`} className="px-3 py-1 border rounded text-sm">Visit</Link>

        {church.locationUrl ? (
          <a href={church.locationUrl} target="_blank" rel="noreferrer" className="px-3 py-1 border rounded text-sm">Directions</a>
        ) : null}

        {church.phone ? (
          <a href={`tel:${church.phone}`} className="ml-auto px-3 py-1 border rounded text-sm">Call</a>
        ) : null}
      </div>
    </article>
  )
}
