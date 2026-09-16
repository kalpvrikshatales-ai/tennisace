import type { Metadata } from 'next'
import PlayClient from './PlayClient'

export const metadata: Metadata = {
  title: 'Find a Tennis Game Near You | TennisAce Play',
  description: 'Post a play request or join one near you. Singles, doubles, hitting sessions and coaching — organized by city.',
}

export default function PlayPage() {
  return <PlayClient />
}
