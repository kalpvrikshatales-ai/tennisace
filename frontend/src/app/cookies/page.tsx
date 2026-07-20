import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy — TennisAce',
  description: 'How TennisAce uses cookies and similar technologies.',
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

function CookieRow({ name, provider, purpose, type }: { name: string; provider: string; purpose: string; type: string }) {
  return (
    <tr>
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--bg-muted)', color: 'var(--text)', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{name}</td>
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--bg-muted)', color: 'var(--text-secondary)', fontSize: 13 }}>{provider}</td>
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--bg-muted)', color: 'var(--text-secondary)', fontSize: 13 }}>{purpose}</td>
      <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--bg-muted)', color: 'var(--text-secondary)', fontSize: 13 }}>{type}</td>
    </tr>
  )
}

export default function CookiesPage() {
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
        Cookie Policy
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 40px', borderBottom: '1px solid var(--bg-muted)', paddingBottom: 20 }}>
        Last updated: July 19, 2026
      </p>

      <P>
        This Cookie Policy explains how TennisAce (<strong style={{ color: 'var(--text)' }}>tennisace.live</strong>), a global tennis platform, uses cookies and similar browser storage technologies. We keep it simple: we use exactly two categories of cookies, described below.
      </P>

      <H2>1. What Are Cookies?</H2>
      <P>
        Cookies are small text files that a website stores in your browser. They allow the site to remember information about your visit — such as whether you are logged in — so you do not have to re-enter it every time. Some cookies are deleted when you close your browser (session cookies); others persist until they expire or you delete them (persistent cookies).
      </P>

      <H2>2. Essential Cookies — Authentication</H2>
      <P>
        These cookies are set by <strong style={{ color: 'var(--text)' }}>Supabase</strong>, our authentication provider, to keep you signed in to TennisAce. Without them, login cannot function. They do not track you across other websites and contain no personally identifiable data beyond an encrypted session token.
      </P>
      <P>
        Because these cookies are strictly necessary for the service to work, they cannot be disabled.
      </P>

      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-subtle)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--bg-muted)' }}>
          <thead>
            <tr style={{ background: 'var(--bg-muted)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Cookie</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Provider</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Purpose</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Type</th>
            </tr>
          </thead>
          <tbody>
            <CookieRow name="sb-access-token" provider="Supabase" purpose="Stores your encrypted login session" type="Essential" />
            <CookieRow name="sb-refresh-token" provider="Supabase" purpose="Keeps your session alive without re-logging in" type="Essential" />
          </tbody>
        </table>
      </div>

      <H2>3. Analytics Cookies — Google Analytics</H2>
      <P>
        We use <strong style={{ color: 'var(--text)' }}>Google Analytics</strong> to understand how visitors use TennisAce — which pages are most popular, how long sessions last, and what devices people use. This helps us prioritise improvements to the platform.
      </P>
      <P>
        Google Analytics cookies collect anonymised, aggregated data. They do not contain your name, email, or any other directly identifying information. Google may process this data on servers outside your country. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Google's Privacy Policy</a> for details.
      </P>

      <div style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-subtle)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--bg-muted)' }}>
          <thead>
            <tr style={{ background: 'var(--bg-muted)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Cookie</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Provider</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Purpose</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Type</th>
            </tr>
          </thead>
          <tbody>
            <CookieRow name="_ga" provider="Google Analytics" purpose="Distinguishes unique visitors (anonymised)" type="Analytics" />
            <CookieRow name="_ga_*" provider="Google Analytics" purpose="Maintains session state for analytics" type="Analytics" />
          </tbody>
        </table>
      </div>

      <H2>4. No Advertising Cookies</H2>
      <P>
        TennisAce does not use advertising cookies, retargeting pixels, or any technology designed to track you across other websites for marketing purposes. We do not sell data to advertisers.
      </P>

      <H2>5. How to Manage or Opt Out of Cookies</H2>
      <P>
        You can control cookies through your browser settings. Most browsers allow you to view, block, or delete cookies. Here are links to cookie management instructions for common browsers:
      </P>
      <ul style={{ margin: '0 0 14px', paddingLeft: 20 }}>
        {[
          ['Chrome', 'https://support.google.com/chrome/answer/95647'],
          ['Firefox', 'https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer'],
          ['Safari', 'https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac'],
          ['Edge', 'https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09'],
        ].map(([browser, url]) => (
          <li key={browser} style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.75, marginBottom: 6 }}>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{browser}</a>
          </li>
        ))}
      </ul>
      <P>
        Please note: blocking essential cookies (Supabase) will prevent you from staying logged in to TennisAce. You can still browse the public parts of the site without them.
      </P>
      <P>
        To opt out of Google Analytics tracking specifically, you can install the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Google Analytics Opt-out Browser Add-on</a>.
      </P>

      <H2>6. Changes to This Policy</H2>
      <P>
        We may update this Cookie Policy when our use of cookies changes. The "Last updated" date at the top of this page reflects the most recent revision.
      </P>

      <H2>7. Contact</H2>
      <P>
        Questions? Email us at <a href="mailto:privacy@tennisace.live" style={{ color: 'var(--accent)', textDecoration: 'none' }}>privacy@tennisace.live</a>.
      </P>
    </div>
  )
}
