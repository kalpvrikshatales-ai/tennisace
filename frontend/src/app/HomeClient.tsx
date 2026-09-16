'use client'

import Link from 'next/link'

const TILES = [
  {
    href: '/sparring',
    icon: '🤝',
    title: 'Find a Partner',
    desc: 'Browse players and coaches near you, filter by level and availability.',
  },
  {
    href: '/play',
    icon: '🎾',
    title: 'Play',
    desc: 'Post a play request or join one — get on court this week.',
  },
  {
    href: '/community',
    icon: '🏘️',
    title: 'Community',
    desc: 'See who\'s building tennis in your city and join the founding wave.',
  },
]

export default function HomeClient() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 pb-nav md:pb-12">
      <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
        Get started
      </p>

      <div className="space-y-3">
        {TILES.map(({ href, icon, title, desc }) => (
          <Link key={href} href={href} className="block">
            <div
              className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[17px] font-black mb-0.5" style={{ color: 'var(--text-primary)' }}>{title}</p>
                <p className="text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </div>
              <span className="text-2xl flex-shrink-0" style={{ color: 'var(--accent)' }}>→</span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-[12px] mt-8" style={{ color: 'var(--text-muted)' }}>
        <a href="https://instagram.com/tennisacelive" target="_blank" rel="noopener noreferrer">
          Follow us → @tennisacelive on Instagram
        </a>
      </p>
    </main>
  )
}
