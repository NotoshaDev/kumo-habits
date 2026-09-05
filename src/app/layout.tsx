import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Outfit } from 'next/font/google'
import { QueryProvider } from '@/providers/QueryProvider'
import './globals.css'

// ---- Google Fonts -------------------------------------------

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// ---- SEO Metadata -------------------------------------------

export const metadata: Metadata = {
  title: {
    default: 'HabitPixel — Habit Tracker Gamificado',
    template: '%s | HabitPixel',
  },
  description:
    'Rastrea tus hábitos diarios con una experiencia gamificada retro arcade. Visualiza tu progreso mensual, gana XP y mantén tus rachas.',
  keywords: ['habit tracker', 'gamificación', 'productividad', 'hábitos', 'PWA'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HabitPixel',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    title: 'HabitPixel — Habit Tracker Gamificado',
    description: 'Rastrea tus hábitos con estética retro arcade/cyberpunk.',
    siteName: 'HabitPixel',
  },
}

export const viewport: Viewport = {
  themeColor: '#08090C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// ---- Root Layout --------------------------------------------

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${jetbrainsMono.variable} ${outfit.variable} dark`}
      suppressHydrationWarning
    >
      <body
        className="bg-[#08090C] text-[#F1F5F9] antialiased overflow-hidden"
        suppressHydrationWarning
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
