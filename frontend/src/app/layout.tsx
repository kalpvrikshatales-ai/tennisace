import type { Metadata } from 'next'
import { Inter, DM_Sans } from 'next/font/google'
import './globals.css'
import LayoutWrapper from '@/components/LayoutWrapper'
import ServiceWorkerUpdater from '@/components/ServiceWorkerUpdater'
import AuthProvider from '@/components/AuthProvider'
import { Analytics } from '@vercel/analytics/react'
import { GoogleAnalytics } from '@next/third-parties/google'

const inter   = Inter({ subsets: ['latin'], variable: '--font-inter' })
const dmSans  = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', weight: ['400','500','600','700','800','900'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://tennisace.live'),
  title: 'TennisAce — Find Tennis Players & Coaches Near You',
  description: 'Find players, find coaches, and build your city\'s tennis community — anywhere in the world.',
  manifest: '/manifest.json',
  themeColor: '#0a0f1a',
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/favicon.ico' },
      { rel: 'icon', url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512' },
    ],
  },
  openGraph: {
    title: 'TennisAce — Find Tennis Players & Coaches Near You',
    description: 'Find players, find coaches, and build your city\'s tennis community — anywhere in the world.',
    url: 'https://tennisace.live',
    siteName: 'TennisAce',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TennisAce — Find Tennis Players & Coaches Near You',
    description: 'Find players, find coaches, and build your city\'s tennis community — anywhere in the world.',
  },
  verification: {
    google: 'SGBHDbGl7iiOC1QnXy5-8PxZrqnPzjyt94iCI85Ydh4',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://tennisace.onrender.com" />
        <link rel="dns-prefetch" href="https://tennisace.onrender.com" />
        {/* Wake up Render backend immediately on page load — prevents 50s cold start */}
        <link rel="preload" href="https://tennisace.onrender.com/health" as="fetch" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TennisAce" />
      </head>
      <body className={`${dmSans.className} min-h-screen bg-white text-gray-900`}>
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
        <ServiceWorkerUpdater />
        <Analytics />
        <GoogleAnalytics gaId="G-B6VCQM3478" />
      </body>
    </html>
  )
}
