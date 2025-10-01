// src/lib/image.ts
export function makeImageUrl(path?: string | null) {
  if (!path) return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'http://127.0.0.1:8000'
  // ensure leading slash
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base.replace(/\/$/, '')}${p}`
}
