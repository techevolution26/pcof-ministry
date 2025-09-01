// // src/components/SermonDetail.tsx
// 'use client'
// import React, { useEffect, useState } from 'react'
// // import SermonSkeleton from './SermonSkeleton'
// import CogMaintenance from './CogMaintenance'
// import Link from 'next/link'

// type Sermon = {
//   id: string
//   title?: string
//   speaker?: string
//   date?: string
//   summary?: string
//   description?: string
//   mediaUrl?: string
//   transcript?: string
//   tags?: string[]
// }

// export default function SermonSkeleton({ id }: { id?: string }) {
//   const [sermon, setSermon] = useState<Sermon | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   // maintenance toggle via env var (NEXT_PUBLIC_MAINTENANCE=true)
//   const maintenanceMode = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_MAINTENANCE === 'true')

//   useEffect(() => {
//     let mounted = true
//     setLoading(true)
//     setError(null)

//     fetch(`/api/sermons/${encodeURIComponent(id)}`)
//       .then(async res => {
//         if (!res.ok) {
//           const json = await res.json().catch(() => ({}))
//           throw new Error(json?.message || 'Failed to load')
//         }
//         return res.json()
//       })
//       .then(data => {
//         if (!mounted) return
//         setSermon(data)
//       })
//       .catch(err => {
//         console.error(err)
//         if (!mounted) return
//         setError(err?.message || 'Error loading sermon')
//       })
//       .finally(() => {
//         if (mounted) setLoading(false)
//       })

//     return () => { mounted = false }
//   }, [id])

//   if (loading) return <SermonSkeleton />

//   if (error) {
//     return (
//       <div className="bg-white border rounded-2xl shadow p-6">
//         <div className="text-red-600 font-semibold">Could not load sermon</div>
//         <div className="text-sm text-slate-600 mt-2">{error}</div>
//         <div className="mt-4">
//           <Link href="/sermons" className="underline">Back to sermons</Link>
//         </div>
//       </div>
//     )
//   }

//   // If no sermon found
//   if (!sermon) {
//     return (
//       <div className="bg-white border rounded-2xl shadow p-6">
//         <div className="text-slate-600">Sermon not found.</div>
//         <div className="mt-3">
//           <Link href="/sermons" className="underline">Back to sermons</Link>
//         </div>
//       </div>
//     )
//   }

//   const dateLabel = sermon.date ? new Date(sermon.date).toLocaleString() : 'TBD'

//   return (
//     <div className="relative">
//       {/* page content (card) */}
//       <div className="bg-white border rounded-2xl shadow p-6 space-y-6">
//         <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
//           <div>
//             <h1 className="text-2xl font-bold text-slate-800">{sermon.title}</h1>
//             <div className="text-sm text-slate-500 mt-1">{sermon.speaker ?? 'PCOF'}</div>
//             <div className="text-xs text-slate-400 mt-1">{dateLabel}</div>
//           </div>

//           <div className="flex gap-3 items-center">
//             <a
//               href={sermon.mediaUrl ?? '#'}
//               className="px-4 py-2 rounded-full border text-sm"
//             >
//               {sermon.mediaUrl ? 'Play / Download' : 'No media'}
//             </a>
//             <Link href="/sermons" className="px-4 py-2 rounded-full border text-sm">Back</Link>
//           </div>
//         </header>

//         {sermon.mediaUrl ? (
//           <div className="w-full rounded overflow-hidden bg-black">
//             {String(sermon.mediaUrl).endsWith('.mp3') || String(sermon.mediaUrl).includes('audio') ? (
//               <audio controls className="w-full">
//                 <source src={sermon.mediaUrl} />
//                 Your browser does not support the audio element.
//               </audio>
//             ) : (
//               <video controls className="w-full">
//                 <source src={sermon.mediaUrl} />
//                 Your browser does not support the video element.
//               </video>
//             )}
//           </div>
//         ) : null}

//         {sermon.summary && <div className="text-sm text-slate-700">{sermon.summary}</div>}
//         {sermon.description && <div className="text-sm text-slate-700 whitespace-pre-line">{sermon.description}</div>}
//         {sermon.transcript && (
//           <section className="mt-4">
//             <h3 className="text-sm font-semibold mb-2">Transcript</h3>
//             <div className="prose max-w-none text-sm text-slate-700 whitespace-pre-line">{sermon.transcript}</div>
//           </section>
//         )}

//         {Array.isArray(sermon.tags) && sermon.tags.length > 0 && (
//           <div className="mt-3 flex flex-wrap gap-2 text-xs">
//             {sermon.tags.map(t => <span key={t} className="px-2 py-0.5 border rounded text-slate-600">{t}</span>)}
//           </div>
//         )}
//       </div>

//       {/* maintenance overlay + decorative cog on the right */}
//       {maintenanceMode && (
//         <>
//           {/* translucent overlay centered message */}
//           <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
//             <div className="max-w-2xl w-full px-6 py-5 bg-white/95 border border-green-100 rounded-2xl text-center shadow-lg">
//               <div className="flex items-center justify-center mb-3">
//                 <div className="w-16 h-16">
//                   <CogMaintenance size={64} />
//                 </div>
//               </div>
//               <h2 className="text-xl font-semibold text-slate-800">This sermon page is currently under maintenance</h2>
//               <p className="text-sm text-slate-600 mt-2">We're improving the sermons library. You can still view the content below — expect intermittent breaks. Contact <a href="mailto:office@pcof.org" className="underline">office@pcof.org</a> for urgent needs.</p>
//             </div>
//           </div>

//           {/* decorative cog fixed to the right, non-interactive */}
//           <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 hidden md:block pointer-events-none" aria-hidden="true">
//             <CogMaintenance size={140} />
//           </div>
//         </>
//       )}
//     </div>
//   )
// }
