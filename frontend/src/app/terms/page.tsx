import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — TennisAce',
  description: 'Terms and conditions for using the TennisAce platform.',
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ color: '#39FF14', fontSize: 16, fontWeight: 800, margin: '36px 0 10px', letterSpacing: -0.2 }}>
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

export default function TermsPage() {
  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: '32px 24px 80px',
      fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
    }}>
      <Link href="/" style={{ color: '#39FF14', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
        ← Back
      </Link>

      <h1 style={{ color: 'var(--text)', fontSize: 28, fontWeight: 900, margin: '0 0 8px', letterSpacing: -0.5 }}>
        Terms of Service
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 40px', borderBottom: '1px solid var(--bg-muted)', paddingBottom: 20 }}>
        Last updated: July 19, 2026
      </p>

      <P>
        Welcome to TennisAce (<strong style={{ color: 'var(--text)' }}>tennisace.live</strong>), a global platform for tennis players and coaches. By accessing or using TennisAce you agree to these Terms of Service. If you do not agree, please do not use the platform.
      </P>

      <H2>1. What TennisAce Is</H2>
      <P>
        TennisAce is a platform that connects tennis players and coaches. It allows users to create public profiles, discover nearby players and coaches, and send or receive play requests. TennisAce is a facilitator — we are not a party to any match, coaching session, or other arrangement made through the platform.
      </P>

      <H2>2. Eligibility</H2>
      <P>
        You must be at least <strong style={{ color: 'var(--text)' }}>16 years old</strong> to create a profile on TennisAce. By registering, you confirm that you meet this age requirement. We reserve the right to remove accounts we have reason to believe belong to minors under 16.
      </P>

      <H2>3. Your Account</H2>
      <P>
        You are responsible for keeping your login credentials secure and for all activity that occurs under your account. You must provide accurate information when creating your profile and keep it up to date. One person may maintain one profile per profile type (player, coach, organiser).
      </P>

      <H2>4. Acceptable Use</H2>
      <P>When using TennisAce, you agree not to:</P>
      <ul style={{ margin: '0 0 14px', paddingLeft: 20 }}>
        <Li>Create a fake or misleading profile, or impersonate any person or entity</Li>
        <Li>Harass, threaten, or abuse other users in any way</Li>
        <Li>Send spam, unsolicited commercial messages, or chain messages</Li>
        <Li>Scrape, crawl, or systematically extract data from TennisAce</Li>
        <Li>Use the platform for any unlawful purpose or in violation of any applicable law</Li>
        <Li>Attempt to gain unauthorised access to any part of the platform or other users' accounts</Li>
        <Li>Post content that is defamatory, obscene, or infringes third-party intellectual property rights</Li>
      </ul>

      <H2>5. Phone Numbers & Off-Platform Communication</H2>
      <P>
        When both parties accept a play or coaching request, phone numbers are exchanged to allow direct coordination. TennisAce facilitates this exchange but is <strong style={{ color: 'var(--text)' }}>not responsible for any communications, disputes, or incidents that occur off-platform</strong> after phone numbers have been shared. You communicate and meet up with other users entirely at your own risk.
      </P>

      <H2>6. Coach Listings</H2>
      <P>
        Coaches who list themselves on TennisAce are <strong style={{ color: 'var(--text)' }}>independent individuals</strong>, not employees or contractors of TennisAce. We do not verify coaching certifications, qualifications, insurance status, or any other credential that a coach may claim. TennisAce makes no representation about the quality, safety, or suitability of any coaching offered through the platform. Users engage with coaches entirely at their own discretion.
      </P>

      <H2>7. No Liability for Matches or Meetups</H2>
      <P>
        TennisAce is not liable for any injury, loss, damage, or dispute arising from a match, coaching session, or any other in-person meeting arranged through the platform. You assume full responsibility for your own safety when meeting other users.
      </P>

      <H2>8. Content You Post</H2>
      <P>
        You retain ownership of any content you submit to TennisAce (profile text, photos, etc.). By posting it, you grant TennisAce a non-exclusive, royalty-free, worldwide licence to display that content on the platform. You confirm you have the right to post such content and that it does not violate any third-party rights.
      </P>

      <H2>9. Profile Removal</H2>
      <P>
        TennisAce reserves the right to suspend or permanently remove any profile or account that violates these Terms, at our sole discretion and without prior notice. We may also remove content we deem harmful, misleading, or otherwise inappropriate for the platform.
      </P>

      <H2>10. Pricing & Founding Members</H2>
      <P>
        TennisAce is currently provided <strong style={{ color: 'var(--text)' }}>free of charge</strong> during the founding member period. We reserve the right to introduce paid features or plans in the future. Founding members will receive advance notice of any such changes by email.
      </P>

      <H2>11. Intellectual Property</H2>
      <P>
        The TennisAce name, logo, design, and all platform content not submitted by users are owned by TennisAce and protected by applicable intellectual property laws. You may not copy, reproduce, or redistribute them without our prior written consent.
      </P>

      <H2>12. Disclaimer of Warranties</H2>
      <P>
        TennisAce is provided "as is" and "as available" without warranties of any kind. We do not guarantee that the platform will be uninterrupted, error-free, or free of harmful components. We disclaim all warranties to the fullest extent permitted by applicable law.
      </P>

      <H2>13. Changes to These Terms</H2>
      <P>
        We may update these Terms of Service from time to time. When we make material changes, we will notify users by email and update the "Last updated" date above. Continued use of TennisAce after changes take effect constitutes acceptance of the revised terms.
      </P>

      <H2>14. Governing Law</H2>
      <P>
        These Terms are governed by applicable law. Disputes arising from your use of TennisAce will be resolved through good-faith negotiation wherever possible. For formal legal matters, you agree to submit to the jurisdiction of the courts where TennisAce is registered.
      </P>

      <H2>15. Contact</H2>
      <P>
        For questions about these Terms, contact us at <a href="mailto:legal@tennisace.live" style={{ color: '#39FF14', textDecoration: 'none' }}>legal@tennisace.live</a>.
      </P>
    </div>
  )
}
