import { redirect, notFound } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://tennisace-api.onrender.com'

export const revalidate = 60

export default async function HandleRedirect({ params }: { params: { handle: string } }) {
  const { handle } = params
  try {
    const res = await fetch(`${API}/sparring/profiles/handle/${encodeURIComponent(handle)}`, {
      next: { revalidate: 60 },
    })
    if (res.status === 404) notFound()
    if (!res.ok) notFound()
    const profile = await res.json()
    redirect(`/sparring/${profile.id}`)
  } catch {
    notFound()
  }
}
