import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import HomeCommunityHero from './HomeCommunityHero'

export const metadata: Metadata = {
  title: 'TennisAce — Find Tennis Players & Coaches Near You',
  description: 'Find players, find coaches, and build your city\'s tennis community — anywhere in the world.',
  openGraph: {
    title: 'TennisAce — Find Tennis Players & Coaches Near You',
    description: 'Find players, find coaches, and build your city\'s tennis community — anywhere in the world.',
    url: 'https://tennisace.live',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TennisAce — Find Tennis Players & Coaches Near You',
    description: 'Find players, find coaches, and build your city\'s tennis community — anywhere in the world.',
  },
  alternates: {
    canonical: 'https://tennisace.live',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://tennisace.live/#organization',
      name: 'TennisAce',
      url: 'https://tennisace.live',
      logo: 'https://tennisace.live/icon-512.png',
      sameAs: [
        'https://instagram.com/tennisacelive',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://tennisace.live/#website',
      url: 'https://tennisace.live',
      name: 'TennisAce',
      description: 'Find tennis players and coaches near you. Build your city\'s tennis community — anywhere in the world.',
      publisher: { '@id': 'https://tennisace.live/#organization' },
      inLanguage: 'en',
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Community hero — the primary story ── */}
      <HomeCommunityHero />

      {/* ── Bold nav tiles: Find a Partner / Play / Community ── */}
      <HomeClient />
    </>
  )
}
