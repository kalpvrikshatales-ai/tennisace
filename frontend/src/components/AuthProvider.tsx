'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export type AuthProfile = {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  city: string | null
  country: string | null
  avatar_url: string | null
}

type AuthContextValue = {
  user: User | null
  profile: AuthProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'https://tennisace.onrender.com'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createSupabaseBrowserClient())
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (u: User) => {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle()

      if (data) {
        setProfile(data as AuthProfile)
      } else {
        const newProfile: AuthProfile = {
          id: u.id,
          email: u.email ?? null,
          full_name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? null,
          avatar_url: u.user_metadata?.avatar_url ?? null,
          phone: null,
          city: null,
          country: null,
        }
        await supabase.from('profiles').insert(newProfile)
        setProfile(newProfile)
      }

      if (u.email && typeof window !== 'undefined') {
        try {
          const res = await fetch(
            `${BACKEND}/sparring/profiles/by-email?email=${encodeURIComponent(u.email)}`
          )
          if (res.ok) {
            const sparring = await res.json()
            if (sparring?.id) {
              localStorage.setItem('sparring_profile_id', sparring.id)
              localStorage.setItem('sparring_email', u.email)
            }
          }
        } catch {}
      }
    } catch {}
  }, [supabase])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u)
      if (u) {
        loadProfile(u).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        loadProfile(u)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, loadProfile])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sparring_profile_id')
      localStorage.removeItem('sparring_email')
    }
    setUser(null)
    setProfile(null)
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
