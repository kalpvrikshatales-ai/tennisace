/* Shared bold-card building blocks — icon rings, section kickers, urgency badges.
   Used across the community, homepage, and play/sparring headers for a consistent
   Breakers-inspired stat-card look. No hooks, safe in server and client components. */

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
