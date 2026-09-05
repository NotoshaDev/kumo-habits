'use client'

import { useEffect, useState } from 'react'

/**
 * SSR-safe media query hook.
 * Returns `null` on the server/first render to avoid hydration mismatches.
 */
export function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

// ---- Convenience breakpoint hooks ----------------------------

/** < 768px */
export function useIsMobile(): boolean {
  const match = useMediaQuery('(max-width: 767px)')
  // Default to false (desktop-first) until hydrated
  return match ?? false
}

/** 768px – 1023px */
export function useIsTablet(): boolean {
  const match = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  return match ?? false
}

/** ≥ 1024px */
export function useIsDesktop(): boolean {
  const match = useMediaQuery('(min-width: 1024px)')
  return match ?? true
}

/** ≥ 1440px — full matrix without horizontal scroll */
export function useIsWidescreen(): boolean {
  const match = useMediaQuery('(min-width: 1440px)')
  return match ?? false
}
