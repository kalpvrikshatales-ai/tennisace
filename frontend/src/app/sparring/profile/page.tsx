'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MySparringProfilePage() {
  const router = useRouter()

  useEffect(() => {
    const id = localStorage.getItem('sparring_profile_id')
    if (id) router.replace(`/sparring/${id}`)
    else    router.replace('/sparring/create')
  }, [router])

  return (
    <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #1a1a1a', borderTopColor: '#39FF14', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
