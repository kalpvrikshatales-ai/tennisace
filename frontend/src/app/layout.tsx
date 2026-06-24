import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'TennisAce — Feel every match. Live.',
  description: 'Live tennis scores from every tournament worldwide.',
  manifest: '/manifest.json',
  themeColor: '#0B1F3A',
  viewport: 'width=device-width, initial-scale=1',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans bg-navy min-h-screen">{children}</body>
    </html>
  )
}
