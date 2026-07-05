import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const otp        = generateOtp()
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min

    // Invalidate any existing unused OTPs for this email
    await supabase
      .from('sparring_otps')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false)

    // Store new OTP
    const { error: insertError } = await supabase
      .from('sparring_otps')
      .insert({ email, otp, expires_at, used: false })

    if (insertError) {
      console.error('OTP insert error:', insertError)
      return NextResponse.json({ error: 'Failed to store OTP' }, { status: 500 })
    }

    // Send via Resend
    const { error: emailError } = await resend.emails.send({
      from:    'TennisAce <noreply@tennisace.live>',
      to:      email,
      subject: 'Your TennisAce verification code',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px">
          <h2 style="margin:0 0 8px;color:#000">Your verification code</h2>
          <p style="color:#555;margin:0 0 24px">Enter this code to verify your TennisAce Sparring profile.</p>
          <div style="background:#000;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="color:#39FF14;font-size:40px;font-weight:900;letter-spacing:12px">${otp}</span>
          </div>
          <p style="color:#999;font-size:13px;margin:0">Valid for 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('send-otp error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
