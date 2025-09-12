'use client'
import React, { useEffect, useState } from 'react'

export default function ThemeProviderClient({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    // On mount, apply user choice or system preference
    try {
      const t = localStorage.getItem('theme')
      if (t === 'dark') { document.documentElement.classList.add('dark'); return }
      if (t === 'light') { document.documentElement.classList.remove('dark'); return }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      }
    } catch (e) { /* ignore */ }
  }, [])

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark')
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light') } catch (e) {}
  }

  // Avoid mismatch — don't render interactive toggle until mounted
  if (!mounted) return <>{children}</>

  return (
    <>
      {children}
      <div style={{ pointerEvents: 'auto' }} className="fixed right-4 bottom-4 z-50">
        <button
          aria-label="Toggle color theme"
          onClick={toggleTheme}
          className="px-3 py-2 bg-surface border rounded shadow-card text-text focus-ring"
        >
          Theme
        </button>
      </div>
    </>
  )
}
