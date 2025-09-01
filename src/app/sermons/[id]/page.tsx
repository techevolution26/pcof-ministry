// app/sermons/page.tsx
import CogMaintenance from '@/components/CogMaintenance'
import Link from 'next/link'

export const revalidate = 300 // keep ISR but content is maintenance placeholder

export default function SermonsMaintenancePage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-md p-8 border border-green-100 text-center space-y-6">
        <div className="mx-auto w-[200px] h-[200px]">
          <CogMaintenance size={200} />
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800">
          Sermons temporarily unavailable
        </h1>

        <p className="text-slate-600 text-lg">
          We're doing some improvements to our sermons library to make it faster and easier to find teachings.
          Sorry for the inconvenience — we expect to be back shortly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sky-600 text-white font-medium shadow-md hover:bg-sky-700 transition-colors"
            aria-label="Return home"
          >
            <span>🏠</span> Return home
          </Link>

          <Link
            href="/churches"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 text-slate-700 font-medium hover:bg-green-50 transition-colors"
            aria-label="Find a church"
          >
            <span>⛪</span> Find a church
          </Link>
        </div>

        <div className="text-sm text-slate-500 mt-4 p-4 bg-green-50 rounded-lg">
          Need a specific sermon or urgent resource? Please <a href="mailto:office@pcof.org" className="text-sky-600 hover:text-sky-700 underline">contact the office</a>.
        </div>

        <div className="text-xs text-slate-400 mt-4">Page status: maintenance · {new Date().toLocaleString()}</div>
      </div>
    </main>
  )
}