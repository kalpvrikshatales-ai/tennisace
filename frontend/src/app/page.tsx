import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import HomeCommunityHero from './HomeCommunityHero'

export const metadata: Metadata = {
  title: 'TennisAce — Find Tennis Players & Coaches Near You',
  description: 'TennisAce — Find tennis players and coaches near you. Join the founding community in Barcelona and Dubai.',
  openGraph: {
    title: 'TennisAce — Find Tennis Players & Coaches Near You',
    description: 'Find tennis players and coaches near you. Join the founding community in Barcelona and Dubai.',
    url: 'https://tennisace.live',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TennisAce — Find Tennis Players & Coaches Near You',
    description: 'Find tennis players and coaches near you. Join the founding community in Barcelona and Dubai.',
  },
  alternates: {
    canonical: 'https://tennisace.live',
  },
}

export default function Home() {
  return (
    <>
      {/* ── Community hero — the primary story ── */}
      <HomeCommunityHero />

      {/* ── Bold nav tiles: Find a Partner / Play / Community ── */}
      <HomeClient />
    </>
  )
}
