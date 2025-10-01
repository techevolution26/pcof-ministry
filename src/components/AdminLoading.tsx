// src/components/AdminLoading.tsx
'use client'

export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-600 border-t-transparent mx-auto" />
        <div className="mt-3 text-sm text-slate-600">Verifying session…</div>
      </div>
    </div>
  )
}
