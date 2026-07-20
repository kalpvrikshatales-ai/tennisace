'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ISO alpha-2 → phone calling code
const CALLING_CODE: Record<string, string> = {
  AC:'+247',AD:'+376',AE:'+971',AF:'+93',AG:'+1',AI:'+1',AL:'+355',AM:'+374',
  AO:'+244',AR:'+54',AS:'+1',AT:'+43',AU:'+61',AW:'+297',AX:'+358',AZ:'+994',
  BA:'+387',BB:'+1',BD:'+880',BE:'+32',BF:'+226',BG:'+359',BH:'+973',BI:'+257',
  BJ:'+229',BL:'+590',BM:'+1',BN:'+673',BO:'+591',BQ:'+599',BR:'+55',BS:'+1',
  BT:'+975',BW:'+267',BY:'+375',BZ:'+501',CA:'+1',CC:'+61',CD:'+243',CF:'+236',
  CG:'+242',CH:'+41',CI:'+225',CK:'+682',CL:'+56',CM:'+237',CN:'+86',CO:'+57',
  CR:'+506',CU:'+53',CV:'+238',CW:'+599',CX:'+61',CY:'+357',CZ:'+420',DE:'+49',
  DJ:'+253',DK:'+45',DM:'+1',DO:'+1',DZ:'+213',EC:'+593',EE:'+372',EG:'+20',
  ER:'+291',ES:'+34',ET:'+251',FI:'+358',FJ:'+679',FK:'+500',FM:'+691',FO:'+298',
  FR:'+33',GA:'+241',GB:'+44',GD:'+1',GE:'+995',GF:'+594',GG:'+44',GH:'+233',
  GI:'+350',GL:'+299',GM:'+220',GN:'+224',GP:'+590',GQ:'+240',GR:'+30',GT:'+502',
  GU:'+1',GW:'+245',GY:'+592',HK:'+852',HN:'+504',HR:'+385',HT:'+509',HU:'+36',
  ID:'+62',IE:'+353',IL:'+972',IM:'+44',IN:'+91',IO:'+246',IQ:'+964',IR:'+98',
  IS:'+354',IT:'+39',JE:'+44',JM:'+1',JO:'+962',JP:'+81',KE:'+254',KG:'+996',
  KH:'+855',KI:'+686',KM:'+269',KN:'+1',KP:'+850',KR:'+82',KW:'+965',KY:'+1',
  KZ:'+7',LA:'+856',LB:'+961',LC:'+1',LI:'+423',LK:'+94',LR:'+231',LS:'+266',
  LT:'+370',LU:'+352',LV:'+371',LY:'+218',MA:'+212',MC:'+377',MD:'+373',ME:'+382',
  MF:'+590',MG:'+261',MH:'+692',MK:'+389',ML:'+223',MM:'+95',MN:'+976',MO:'+853',
  MP:'+1',MQ:'+596',MR:'+222',MS:'+1',MT:'+356',MU:'+230',MV:'+960',MW:'+265',
  MX:'+52',MY:'+60',MZ:'+258',NA:'+264',NC:'+687',NE:'+227',NF:'+672',NG:'+234',
  NI:'+505',NL:'+31',NO:'+47',NP:'+977',NR:'+674',NU:'+683',NZ:'+64',OM:'+968',
  PA:'+507',PE:'+51',PF:'+689',PG:'+675',PH:'+63',PK:'+92',PL:'+48',PM:'+508',
  PR:'+1',PS:'+970',PT:'+351',PW:'+680',PY:'+595',QA:'+974',RE:'+262',RO:'+40',
  RS:'+381',RU:'+7',RW:'+250',SA:'+966',SB:'+677',SC:'+248',SD:'+249',SE:'+46',
  SG:'+65',SH:'+290',SI:'+386',SJ:'+47',SK:'+421',SL:'+232',SM:'+378',SN:'+221',
  SO:'+252',SR:'+597',SS:'+211',ST:'+239',SV:'+503',SX:'+1',SY:'+963',SZ:'+268',
  TC:'+1',TD:'+235',TG:'+228',TH:'+66',TJ:'+992',TK:'+690',TL:'+670',TM:'+993',
  TN:'+216',TO:'+676',TR:'+90',TT:'+1',TV:'+688',TZ:'+255',UA:'+380',UG:'+256',
  US:'+1',UY:'+598',UZ:'+998',VA:'+39',VC:'+1',VE:'+58',VG:'+1',VI:'+1',
  VN:'+84',VU:'+678',WF:'+681',WS:'+685',YE:'+967',YT:'+262',ZA:'+27',ZM:'+260',
  ZW:'+263',
}

// [name, cc1, cc2, ...] — cc1 is the most populous country with that city name
type CityEntry = [string, ...string[]]

let citiesCache: CityEntry[] | null = null
let loadPromise: Promise<CityEntry[]> | null = null

function loadCities(): Promise<CityEntry[]> {
  if (citiesCache) return Promise.resolve(citiesCache)
  if (loadPromise) return loadPromise
  loadPromise = fetch('/cities.json')
    .then(r => r.json())
    .then((data: CityEntry[]) => { citiesCache = data; return data })
  return loadPromise
}

const dn = typeof Intl !== 'undefined'
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null

function countryName(code: string): string {
  try { return dn?.of(code) ?? code } catch { return code }
}

export interface CitySelection {
  city: string
  country: string
  countryCode: string
  callingCode: string
}

interface Props {
  value?: string
  onChange: (sel: CitySelection) => void
  label?: string
  required?: boolean
  inputStyle?: React.CSSProperties
}

export default function CityPicker({ value, onChange, label = 'City', required, inputStyle: extStyle }: Props) {
  const [query, setQuery]       = useState(value ?? '')
  const [results, setResults]   = useState<{ label: string; city: string; cc: string }[]>([])
  const [active, setActive]     = useState(-1)
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [confirmed, setConfirmed] = useState(!!value)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync external value changes (edit form prefill)
  useEffect(() => {
    if (value && value !== query) { setQuery(value); setConfirmed(true) }
  }, [value])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const data = await loadCities()
      const lower = q.toLowerCase()
      const exact: typeof results = []
      const contains: typeof results = []
      for (const entry of data) {
        const name = entry[0]
        const nl   = name.toLowerCase()
        const ccs  = entry.slice(1) as string[]
        // One result per (name, country) pair, top country first
        for (const cc of ccs) {
          const label = `${name}, ${countryName(cc)}`
          const item  = { label, city: name, cc }
          if (nl.startsWith(lower)) exact.push(item)
          else if (nl.includes(lower)) contains.push(item)
          if (exact.length + contains.length >= 24) break
        }
        if (exact.length + contains.length >= 24) break
      }
      const merged = [...exact, ...contains].slice(0, 8)
      setResults(merged)
      setOpen(merged.length > 0)
      setActive(-1)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    setConfirmed(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 150)
  }

  function select(item: { label: string; city: string; cc: string }) {
    const country     = countryName(item.cc)
    const callingCode = CALLING_CODE[item.cc] ?? ''
    setQuery(item.label)
    setOpen(false)
    setConfirmed(true)
    setResults([])
    onChange({ city: item.city, country, countryCode: item.cc, callingCode })
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); if (active >= 0 && results[active]) select(results[active]) }
    if (e.key === 'Escape')    { setOpen(false) }
  }

  function handleBlur(e: React.FocusEvent) {
    if (containerRef.current?.contains(e.relatedTarget as Node)) return
    setOpen(false)
    if (!confirmed) { setQuery(''); setResults([]) }
  }

  const baseInput: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'var(--sr-input, rgba(255,255,255,0.05))',
    border: `1px solid ${confirmed ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--sr-border, rgba(255,255,255,0.1))'}`,
    borderRadius: 8, color: 'var(--sr-text, #fff)',
    padding: '0 36px 0 14px', fontSize: 14, outline: 'none', height: 48,
    ...extStyle,
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }} onBlur={handleBlur}>
      <style>{`
        .cp-drop { animation: cp-in 0.14s ease; }
        @keyframes cp-in { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
        .cp-item:hover { background: color-mix(in srgb, var(--accent) 10%, transparent) !important; color: var(--accent) !important; }
      `}</style>

      {label && (
        <p style={{ color: 'var(--sr-muted, rgba(255,255,255,0.4))', fontSize: 12, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}{required && ' *'}
        </p>
      )}

      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder="Type your city…"
          autoComplete="off"
          style={baseInput}
        />
        {/* Icon */}
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          color: confirmed ? 'var(--accent)' : 'rgba(255,255,255,0.25)', fontSize: 14, pointerEvents: 'none',
        }}>
          {loading ? '…' : confirmed ? '✓' : '⌕'}
        </span>
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="cp-drop" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
          background: '#0f1520', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          {results.map((r, i) => (
            <button
              key={r.label}
              type="button"
              className="cp-item"
              onMouseDown={() => select(r)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', background: i === active ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                color: i === active ? 'var(--accent)' : 'rgba(255,255,255,0.75)',
                fontSize: 14, fontWeight: i === active ? 700 : 500,
                border: 'none', cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'background 0.1s, color 0.1s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="cp-drop" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
          background: '#0f1520', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '12px 14px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
            City not found — try a different spelling
          </p>
        </div>
      )}
    </div>
  )
}
