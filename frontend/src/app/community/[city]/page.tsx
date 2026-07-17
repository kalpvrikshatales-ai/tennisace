import type { Metadata } from 'next'
import CityProgressClient from './CityProgressClient'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

export const revalidate = 300

async function getCityData(city: string) {
  try {
    const res = await fetch(`${BACKEND}/sparring/city-progress/${encodeURIComponent(city)}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const city = decodeURIComponent(params.city)
  const data = await getCityData(city)
  const count = data ? (data.player_count + data.coach_count) : 0
  return {
    title: `${city} Tennis Community · TennisAce`,
    description: `${count} founding members are building ${city}'s tennis community on TennisAce. Join them.`,
    openGraph: {
      title: `${city} Tennis Community`,
      description: `${count} players and coaches building the local tennis scene.`,
    },
  }
}

export default async function CityProgressPage({ params }: { params: { city: string } }) {
  const city = decodeURIComponent(params.city)
  const data = await getCityData(city)
  return <CityProgressClient city={city} initialData={data} />
}
