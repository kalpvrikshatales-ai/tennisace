'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SparringShell from '../SparringShell'

export default function MySparringProfilePage() {
  const router = useRouter()

  useEffect(() => {
    const id = localStorage.getItem('sparring_profile_id')
    if (id) router.replace(`/sparring/${id}`)
    else    router.replace('/sparring/create')
  }, [router])

  return (
    <SparringShell>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--sr-border)', borderTopColor: 'var(--sr-accent)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </SparringShell>
  )
}
