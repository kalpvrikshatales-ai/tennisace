'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getFlag } from '@/lib/flags'

const SUPABASE_URL = 'https://wffxyjuecritbiyfdane.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZnh5anVlY3JpdGJpeWZkYW5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjc0NDMsImV4cCI6MjA5NzkwMzQ0M30.Df8puFsrY35AUbFnogzlSFwve9nlcHz2vk-emc4jiZM'

const LOUNGES = [
  { id: 'wimbledon',    name: 'Wimbledon',       emoji: '🌿', color: '#22C55E', bg: '#F0FDF4', desc: '5 days to go · Grass · SW19' },
  { id: 'atptour',     name: 'ATP Tour',         emoji: '🎾', color: '#00C875', bg: '#F0FDF9', desc: 'All ATP matches & ranking moves' },
  { id: 'wta',         name: 'WTA Tour',         emoji: '💜', color: '#8B5CF6', bg: '#F5F3FF', desc: 'Women\'s tennis · All events' },
  { id: 'usopen',      name: 'US Open',          emoji: '🔵', color: '#3B82F6', bg: '#EFF6FF', desc: 'Aug 24 · Flushing Meadows · Hard' },
  { id: 'rolandgarros',name: 'Roland Garros',    emoji: '🏺', color: '#F97316', bg: '#FFF7ED', desc: 'The clay court cathedral · Paris' },
  { id: 'general',     name: 'General Talk',     emoji: '💬', color: '#6B7280', bg: '#F9FAFB', desc: 'Tennis chat, tips & banter' },
]

const AVATAR_COLORS = ['#00C875','#3B82F6','#8B5CF6','#F97316','#EF4444','#F59E0B','#14B8A6','#EC4899']

interface Post {
  id: string
  lounge: string
  username: string
  avatar_color: string
  message: string
  likes: number
  created_at: string
}

interface Profile { name: string; fav_player: string; color: string }

function timeAgo(ts: string) {
  const s = (Date.now() - new Date(ts).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m`
  if (s < 86400) return `${Math.floor(s/3600)}h`
  return `${Math.floor(s/86400)}d`
}

function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {name.slice(0,1).toUpperCase()}
    </div>
  )
}

export default function LoungesPage() {
  const router = useRouter()
  const [activeLoungeId, setActiveLoungeId] = useState('wimbledon')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftPlayer, setDraftPlayer] = useState('')
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const bottomRef = useRef<HTMLDivElement>(null)

  const lounge = LOUNGES.find(l => l.id === activeLoungeId)!

  // Load profile from localStorage
  useEffect(() => {
    const p = localStorage.getItem('ta_profile')
    if (p) setProfile(JSON.parse(p))
    else setShowProfile(true)
    const liked = localStorage.getItem('ta_liked')
    if (liked) setLikedIds(new Set(JSON.parse(liked)))
  }, [])

  // Fetch posts for active lounge
  useEffect(() => {
    setLoading(true)
    fetch(`${SUPABASE_URL}/rest/v1/lounge_posts?lounge=eq.${activeLoungeId}&order=created_at.desc&limit=50`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }})
      .then(r => r.json())
      .then(d => { setPosts(Array.isArray(d) ? d.reverse() : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeLoungeId])

  const saveProfile = () => {
    if (!draftName.trim()) return
    const p: Profile = {
      name: draftName.trim(),
      fav_player: draftPlayer.trim(),
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    }
    setProfile(p)
    localStorage.setItem('ta_profile', JSON.stringify(p))
    setShowProfile(false)
  }

  const sendPost = async () => {
    if (!message.trim() || !profile || sending) return
    setSending(true)
    const post = {
      lounge: activeLoungeId,
      username: profile.name,
      avatar_color: profile.color,
      message: message.trim(),
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/lounge_posts`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(post),
    })
    const created = await res.json()
    if (Array.isArray(created) && created[0]) {
      setPosts(p => [...p, created[0]])
      setMessage('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    setSending(false)
  }

  const likePost = async (postId: string, current: number) => {
    if (likedIds.has(postId)) return
    const newLiked = new Set(Array.from(likedIds).concat(postId))
    setLikedIds(newLiked)
    localStorage.setItem('ta_liked', JSON.stringify(Array.from(newLiked)))
    setPosts(p => p.map(post => post.id === postId ? { ...post, likes: post.likes + 1 } : post))
    await fetch(`${SUPABASE_URL}/rest/v1/lounge_posts?id=eq.${postId}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ likes: current + 1 }),
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm font-semibold transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <img src="/logo.png" alt="TennisAce" className="h-7 w-auto" />
          <span className="text-lg font-black text-gray-900 ml-1">Lounges</span>
          {profile && (
            <button onClick={() => setShowProfile(true)} className="ml-auto flex items-center gap-2">
              <Avatar name={profile.name} color={profile.color} size={30} />
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">{profile.name}</span>
            </button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 flex-1 flex flex-col md:flex-row gap-4 pb-nav md:pb-6">

        {/* Sidebar — lounge list */}
        <div className="md:w-56 flex-shrink-0">
          <p className="label mb-3 mt-2">Tournament Rooms</p>
          <div className="space-y-1">
            {LOUNGES.map(l => (
              <button key={l.id} onClick={() => setActiveLoungeId(l.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-2.5 ${
                  activeLoungeId === l.id ? 'font-bold shadow-sm' : 'hover:bg-gray-50'
                }`}
                style={activeLoungeId === l.id ? { background: l.bg, color: l.color } : { color: '#475569' }}>
                <span className="text-lg">{l.emoji}</span>
                <span className="text-[14px] font-semibold truncate">{l.name}</span>
              </button>
            ))}
          </div>

          {profile && (
            <div className="mt-6 card p-3">
              <p className="label mb-2">Your Profile</p>
              <div className="flex items-center gap-2">
                <Avatar name={profile.name} color={profile.color} size={32} />
                <div>
                  <p className="text-sm font-bold text-gray-900">{profile.name}</p>
                  {profile.fav_player && <p className="text-[11px] text-gray-400">❤️ {profile.fav_player}</p>}
                </div>
              </div>
              <button onClick={() => setShowProfile(true)} className="mt-2 text-[11px] text-gray-400 hover:text-gray-600">Edit profile →</button>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-[60vh]">
          {/* Lounge header */}
          <div className="flex items-center gap-3 py-3 border-b border-gray-100 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: lounge.bg }}>
              {lounge.emoji}
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">{lounge.name}</h2>
              <p className="text-[11px] text-gray-400">{lounge.desc}</p>
            </div>
          </div>

          {/* Posts */}
          <div className="flex-1 space-y-3 overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">{lounge.emoji}</p>
                <p className="font-bold text-gray-900 mb-1">Be the first to post!</p>
                <p className="text-gray-400 text-sm">Start the conversation in the {lounge.name} lounge.</p>
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="flex gap-3">
                  <Avatar name={post.username} color={post.avatar_color} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-[13px] font-bold text-gray-900">{post.username}</span>
                      <span className="text-[10px] text-gray-300">{timeAgo(post.created_at)}</span>
                    </div>
                    <div className="card px-3 py-2 inline-block max-w-full">
                      <p className="text-[14px] text-gray-800 leading-snug break-words">{post.message}</p>
                    </div>
                    <button
                      onClick={() => likePost(post.id, post.likes)}
                      className={`mt-1 flex items-center gap-1 text-[11px] transition-colors ${
                        likedIds.has(post.id) ? 'text-red-400' : 'text-gray-300 hover:text-red-400'
                      }`}
                    >
                      ♥ {post.likes > 0 ? post.likes : ''}
                    </button>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Message input */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {!profile ? (
              <button onClick={() => setShowProfile(true)}
                className="w-full py-3 rounded-xl bg-gray-50 text-gray-400 text-sm font-medium hover:bg-gray-100 transition-colors">
                Set up your profile to join the conversation →
              </button>
            ) : (
              <div className="flex gap-2 items-end">
                <Avatar name={profile.name} color={profile.color} size={32} />
                <div className="flex-1 card flex items-center gap-2 px-3 py-2">
                  <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendPost()}
                    placeholder={`Message ${lounge.name}...`}
                    className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder-gray-400 outline-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <button onClick={sendPost} disabled={!message.trim() || sending}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: message.trim() ? '#00C875' : '#E2E8F0' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={message.trim() ? 'white' : '#94A3B8'} strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile setup modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowProfile(false) }}>
          <div className="card w-full max-w-sm p-6 relative">
            {/* Close button — always visible */}
            <button
              onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <h3 className="headline mb-1 text-gray-900 pr-8">{profile ? 'Edit Profile' : 'Join the Lounge'}</h3>
            <p className="text-gray-400 text-sm mb-5">Set your name to start chatting with tennis fans.</p>

            {/* Avatar preview */}
            <div className="flex justify-center mb-5">
              <Avatar
                name={draftName || profile?.name || '?'}
                color={profile?.color || AVATAR_COLORS[0]}
                size={64}
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="label block mb-1.5">Your Name</label>
                <input
                  value={draftName || profile?.name || ''}
                  onChange={e => setDraftName(e.target.value)}
                  placeholder="e.g. TennisFan2026"
                  className="w-full card px-3 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 outline-none"
                  style={{ color: 'var(--text-primary)' }}
                  onKeyDown={e => e.key === 'Enter' && saveProfile()}
                />
              </div>
              <div>
                <label className="label block mb-1.5">Favourite Player (optional)</label>
                <input
                  value={draftPlayer || profile?.fav_player || ''}
                  onChange={e => setDraftPlayer(e.target.value)}
                  placeholder="e.g. Carlos Alcaraz"
                  className="w-full card px-3 py-2.5 text-[14px] text-gray-900 placeholder-gray-400 outline-none"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              {profile && (
                <button onClick={() => setShowProfile(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm">
                  Cancel
                </button>
              )}
              <button onClick={saveProfile}
                className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-all"
                style={{ background: (draftName || profile?.name) ? '#00C875' : '#E2E8F0', color: (draftName || profile?.name) ? 'white' : '#94A3B8' }}>
                {profile ? 'Save' : 'Join Lounges 🎾'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
