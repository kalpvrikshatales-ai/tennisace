import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json({ verified: false, error: 'Email and OTP are required' }, { status: 400 })
    }

    const { data: rows, error } = await supabase
      .from('sparring_otps')
      .select('id, expires_at, used')
      .eq('email', email)
      .eq('otp', otp)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      return NextResponse.json({ verified: false, error: 'Database error' }, { status: 500 })
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ verified: false, error: 'Invalid or expired code' })
    }

    const row = rows[0]

    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ verified: false, error: 'Code expired. Request a new one.' })
    }

    // Mark as used
    await supabase
      .from('sparring_otps')
      .update({ used: true })
      .eq('id', row.id)

    return NextResponse.json({ verified: true })
  } catch (e) {
    console.error('verify-otp error:', e)
    return NextResponse.json({ verified: false, error: 'Internal server error' }, { status: 500 })
  }
}
