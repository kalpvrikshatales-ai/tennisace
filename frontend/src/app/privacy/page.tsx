import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — TennisAce',
  description: 'How TennisAce collects, uses, and protects your personal data.',
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 800, margin: '36px 0 10px', letterSpacing: -0.2 }}>
    {children}
  </h2>
)

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.75, margin: '0 0 14px' }}>
    {children}
  </p>
)

const Li = ({ children }: { children: React.ReactNode }) => (
  <li style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.75, marginBottom: 6 }}>
    {children}
  </li>
)

export default function PrivacyPage() {
  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: '32px 24px 80px',
      fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
    }}>
      <Link href="/" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
        ← Back
      </Link>

      <h1 style={{ color: 'var(--text)', fontSize: 28, fontWeight: 900, margin: '0 0 8px', letterSpacing: -0.5 }}>
        Privacy Policy
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 40px', borderBottom: '1px solid var(--bg-muted)', paddingBottom: 20 }}>
        Last updated: July 19, 2026
      </p>

      <P>
        TennisAce (<strong style={{ color: 'var(--text)' }}>tennisace.live</strong>) is a global platform for tennis players and coaches. This Privacy Policy explains what personal data we collect, why we collect it, and how we protect it. By using TennisAce you agree to the practices described here.
      </P>

      <H2>1. Data We Collect</H2>
      <P>When you create a profile or use TennisAce, we may collect:</P>
      <ul style={{ margin: '0 0 14px', paddingLeft: 20 }}>
        <Li><strong style={{ color: 'var(--text)' }}>Name</strong> — displayed on your public profile</Li>
        <Li><strong style={{ color: 'var(--text)' }}>Email address</strong> — used for OTP login verification and service notifications</Li>
        <Li><strong style={{ color: 'var(--text)' }}>Phone number</strong> (optional) — hidden from public view; shared only with a matched player or coach after both parties accept a request</Li>
        <Li><strong style={{ color: 'var(--text)' }}>City and country</strong> — to connect you with nearby players and coaches</Li>
        <Li><strong style={{ color: 'var(--text)' }}>Profile photo</strong> — displayed on your public profile</Li>
        <Li><strong style={{ color: 'var(--text)' }}>Tennis preferences</strong> — level, surfaces, play style, availability, and similar details you choose to provide</Li>
        <Li><strong style={{ color: 'var(--text)' }}>Match history and play requests</strong> — records of requests you send or receive through the platform</Li>
      </ul>
      <P>
        If you sign in with Google OAuth, we receive your name, email address, and profile photo directly from Google. We do not receive your Google password or any payment information.
      </P>

      <H2>2. Why We Collect It</H2>
      <ul style={{ margin: '0 0 14px', paddingLeft: 20 }}>
        <Li>To create and display your public tennis profile so other players and coaches can find you</Li>
        <Li>To send OTP verification codes and account-related notifications</Li>
        <Li>To share your phone number with a matched user once both parties accept a play request</Li>
        <Li>To improve the TennisAce service — understanding how features are used helps us build better ones</Li>
      </ul>

      <H2>3. Phone Numbers</H2>
      <P>
        Your phone number is <strong style={{ color: 'var(--text)' }}>never shown publicly</strong> and is never visible on your profile page. It is only revealed to another user after both parties have mutually accepted a play or coaching request. We do not sell, rent, or share phone numbers with any third party.
      </P>

      <H2>4. Email Address</H2>
      <P>
        Your email is used exclusively for OTP login codes and transactional notifications related to your TennisAce account (e.g. a request was accepted). We <strong style={{ color: 'var(--text)' }}>never sell your email address</strong>, never share it with advertisers, and never add you to marketing lists without your explicit consent.
      </P>

      <H2>5. Data Storage & Security</H2>
      <P>
        Your data is stored in <strong style={{ color: 'var(--text)' }}>Supabase</strong>, a hosted database platform running on Amazon Web Services (AWS) infrastructure with encryption at rest and in transit. We apply reasonable technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure.
      </P>

      <H2>6. Data Retention</H2>
      <P>
        Profile data is retained until you delete your account. After account deletion, we remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes such as fraud prevention.
      </P>

      <H2>7. Cookies & Analytics</H2>
      <P>We use two categories of cookies:</P>
      <ul style={{ margin: '0 0 14px', paddingLeft: 20 }}>
        <Li><strong style={{ color: 'var(--text)' }}>Authentication cookies</strong> — set by Supabase to keep you logged in. These are strictly necessary and cannot be disabled without breaking login functionality.</Li>
        <Li><strong style={{ color: 'var(--text)' }}>Analytics cookies</strong> — set by Google Analytics to help us understand how users navigate TennisAce (pages visited, session duration, device type). No personally identifiable information is sent to Google Analytics.</Li>
      </ul>
      <P>We do not use advertising or tracking cookies. See our <Link href="/cookies" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Cookie Policy</Link> for full details.</P>

      <H2>8. Your Rights (GDPR)</H2>
      <P>
        If you are located in the European Economic Area or United Kingdom, you have rights under the GDPR including the right to:
      </P>
      <ul style={{ margin: '0 0 14px', paddingLeft: 20 }}>
        <Li>Access the personal data we hold about you</Li>
        <Li>Correct inaccurate or incomplete data</Li>
        <Li>Request deletion of your personal data ("right to be forgotten")</Li>
        <Li>Object to or restrict certain processing activities</Li>
        <Li>Receive your data in a portable format</Li>
      </ul>
      <P>
        To exercise any of these rights, email us at <a href="mailto:privacy@tennisace.live" style={{ color: 'var(--accent)', textDecoration: 'none' }}>privacy@tennisace.live</a>. We will respond within 30 days.
      </P>

      <H2>9. Third-Party Services</H2>
      <P>TennisAce uses the following third-party services that may process your data under their own privacy policies:</P>
      <ul style={{ margin: '0 0 14px', paddingLeft: 20 }}>
        <Li><strong style={{ color: 'var(--text)' }}>Supabase</strong> — database and authentication</Li>
        <Li><strong style={{ color: 'var(--text)' }}>Google</strong> — OAuth sign-in and Analytics</Li>
        <Li><strong style={{ color: 'var(--text)' }}>Vercel</strong> — web hosting and CDN</Li>
      </ul>
      <P>We do not sell personal data to any third party.</P>

      <H2>10. Children</H2>
      <P>
        TennisAce is not intended for users under 16 years of age. We do not knowingly collect personal data from children. If you believe a child has submitted data to us, contact us and we will delete it promptly.
      </P>

      <H2>11. Changes to This Policy</H2>
      <P>
        We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top and, for material changes, notify users by email.
      </P>

      <H2>12. Contact</H2>
      <P>
        For privacy-related questions or requests, contact us at <a href="mailto:privacy@tennisace.live" style={{ color: 'var(--accent)', textDecoration: 'none' }}>privacy@tennisace.live</a>.
      </P>
    </div>
  )
}
