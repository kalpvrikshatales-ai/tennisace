/* Shared bold-card building blocks — icon rings, section kickers, urgency badges,
   and the two button styles (dark/primary, light/secondary) used everywhere.
   Used across the community, homepage, and play/sparring headers for a consistent
   Breakers-inspired stat-card look. No hooks, safe in server and client components. */

import Link from 'next/link'

type ButtonOpts = { fullWidth?: boolean; compact?: boolean }

/* Dark/filled style — the one primary action per screen (join, create, post).
   Exported as a plain style object so both <Link> and <button onClick> can share
   the exact same look — not every primary action is a navigation. */
export function primaryButtonStyle({ fullWidth, compact }: ButtonOpts = {}): React.CSSProperties {
  return {
    display: fullWidth ? 'flex' : 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'var(--accent)', color: '#000', fontWeight: 900, fontSize: compact ? 13 : 15,
    padding: compact ? '10px 18px' : '15px 30px', borderRadius: compact ? 10 : 12, textDecoration: 'none',
    boxShadow: compact
      ? '0 0 16px color-mix(in srgb, var(--accent) 22%, transparent)'
      : '0 0 32px color-mix(in srgb, var(--accent) 30%, transparent), 0 4px 20px rgba(0,0,0,0.25)',
    letterSpacing: -0.2, whiteSpace: 'nowrap', width: fullWidth ? '100%' : undefined,
    border: 'none', cursor: 'pointer',
  }
}

/* Light/outline style — the secondary action alongside a primary one. */
export function secondaryButtonStyle({ fullWidth, compact }: ButtonOpts = {}): React.CSSProperties {
  return {
    display: fullWidth ? 'flex' : 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'rgba(255,255,255,0.04)', color: 'var(--text)', fontWeight: 800, fontSize: compact ? 13 : 15,
    padding: compact ? '10px 18px' : '15px 30px', borderRadius: compact ? 10 : 12, textDecoration: 'none',
    border: '1.5px solid color-mix(in srgb, var(--accent) 38%, transparent)',
    letterSpacing: -0.2, whiteSpace: 'nowrap', width: fullWidth ? '100%' : undefined,
    cursor: 'pointer',
  }
}

type ButtonProps = ButtonOpts & {
  href:      string
  children:  React.ReactNode
  style?:    React.CSSProperties
}

/* Dark/filled button — the one primary action per screen (join, create, post). */
export function PrimaryButton({ href, children, style, ...opts }: ButtonProps) {
  return (
    <Link href={href} className="ta-btn-primary" style={{ ...primaryButtonStyle(opts), ...style }}>
      {children}
    </Link>
  )
}

/* Light/outline button — the secondary action alongside a primary one. */
export function SecondaryButton({ href, children, style, ...opts }: ButtonProps) {
  return (
    <Link href={href} className="ta-btn-secondary" style={{ ...secondaryButtonStyle(opts), ...style }}>
      {children}
    </Link>
  )
}

export function IconRing({ icon, size = 40 }: { icon: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
      border: '1.5px solid color-mix(in srgb, var(--accent) 40%, transparent)',
      fontSize: size * 0.46,
    }}>
      {icon}
    </div>
  )
}

export function SectionLabel({ icon, kicker, title }: { icon: string; kicker: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <IconRing icon={icon} size={36} />
      <div>
        <p style={{ color: 'var(--accent)', fontSize: 10, fontWeight: 800, letterSpacing: 1.6, textTransform: 'uppercase', margin: '0 0 2px' }}>
          {kicker}
        </p>
        <p style={{ color: 'var(--text)', fontSize: 17, fontWeight: 900, letterSpacing: -0.3, margin: 0 }}>
          {title}
        </p>
      </div>
    </div>
  )
}

export function UrgencyBadge({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
      border: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)',
      borderRadius: 20, padding: '3px 10px 3px 8px',
      color: 'var(--accent)', fontSize: 10, fontWeight: 800, letterSpacing: 0.4,
      animation: 'pulse 2s ease-in-out infinite',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
      {label}
    </span>
  )
}
