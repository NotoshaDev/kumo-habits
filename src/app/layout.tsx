import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Outfit } from 'next/font/google'
import { QueryProvider } from '@/providers/QueryProvider'
import { FeedbackModal } from '@/components/ui/FeedbackModal'
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
    default: 'Kumo Habits — Habit Tracker Gamificado',
    template: '%s | Kumo Habits',
  },
  description:
    'Rastrea tus hábitos diarios con una experiencia gamificada retro arcade. Visualiza tu progreso mensual, gana XP y mantén tus rachas. by NotoshaDev.',
  keywords: ['habit tracker', 'gamificación', 'productividad', 'hábitos', 'PWA', 'kumo habits'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kumo Habits',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    title: 'Kumo Habits — Habit Tracker Gamificado',
    description: 'Rastrea tus hábitos con estética retro arcade/cyberpunk. by NotoshaDev.',
    siteName: 'Kumo Habits',
  },
}

export const viewport: Viewport = {
  themeColor: '#08090C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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
        <QueryProvider>
          {children}
          <FeedbackModal />
        </QueryProvider>
      </body>
    </html>
  )
}
