// src/components/Logo.client.tsx
'use client'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export default function Logo({ size = 40 }: { size?: number }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  // use SVG that uses currentColor OR two images:
  const src = isDark ? '/images/logo-light.svg' : '/images/logo-dark.svg'
  return <Image src={src} alt="PCOF" width={size} height={size} />
}
