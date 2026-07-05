import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Server-only — never import in 'use client' files
export const supabaseServer = url && serviceKey
  ? createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null
