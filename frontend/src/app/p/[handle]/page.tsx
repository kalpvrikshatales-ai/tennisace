import { redirect } from 'next/navigation'

export default async function HandleRedirect({ params }: { params: { handle: string } }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/sparring/profiles/by-handle?handle=${params.handle}`,
    { next: { revalidate: 60 } },
  )
  if (!res.ok) redirect('/sparring')
  const profile = await res.json()
  if (!profile?.id) redirect('/sparring')
  redirect(`/sparring/${profile.id}`)
}
