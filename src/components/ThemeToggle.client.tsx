// src/components/ThemeToggle.client.tsx
'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // only show after mount to avoid mismatch
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-[color:var(--c-surface)] text-[color:var(--c-text)] hover:shadow-sm focus:outline-none"
    >
      {isDark ? '🌙' : '☀️'}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
