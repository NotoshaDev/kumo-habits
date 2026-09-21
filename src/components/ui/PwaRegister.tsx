'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        registration.onupdatefound = () => {
          const installingWorker = registration.installing
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New update available; can auto-activate
                installingWorker.postMessage({ type: 'SKIP_WAITING' })
              }
            }
          }
        }
      } catch (err) {
        // Quietly handle registration errors in dev/unsupported envs
        console.warn('PWA Service Worker registration skipped or failed:', err)
      }
    }

    // Register after initial window load for maximum performance
    if (document.readyState === 'complete') {
      registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker)
      return () => window.removeEventListener('load', registerServiceWorker)
    }
  }, [])

  return null
}
