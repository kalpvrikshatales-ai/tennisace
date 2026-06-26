import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'TennisAce — Feel every match. Live.',
  description: 'Live tennis scores from every tournament worldwide. Wimbledon, US Open, Roland Garros, Australian Open — feel every match.',
  manifest: '/manifest.json',
  themeColor: '#FFFFFF',
  viewport: 'width=device-width, initial-scale=1',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'TennisAce — Feel every match. Live.',
    description: 'Live tennis scores from every tournament worldwide.',
    url: 'https://tennisace.live',
    siteName: 'TennisAce',
    type: 'website',
    images: [{ url: 'https://tennisace.live/og.png', width: 1200, height: 630, alt: 'TennisAce Live Scores' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TennisAce — Feel every match. Live.',
    description: 'Live tennis scores from every tournament worldwide.',
    images: ['https://tennisace.live/og.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TennisAce" />
      </head>
      <body className="font-sans min-h-screen bg-white text-gray-900">{children}</body>
    </html>
  )
}
