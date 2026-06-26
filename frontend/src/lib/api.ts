const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const getLiveMatches  = () => fetch(`${API}/matches/live`).then(r => r.json())
export const getTournaments  = () => fetch(`${API}/tournaments/`).then(r => r.json())
export const getRankings     = (type: 'ATP' | 'WTA') => fetch(`${API}/players/rankings?type=${type}`).then(r => r.json())
export const getResults      = (days = 3) => fetch(`${API}/feed/results?days=${days}`).then(r => r.json())
export const getFixtures     = (days = 3) => fetch(`${API}/feed/fixtures?days=${days}`).then(r => r.json())
export const getPlayer       = (key: string) => fetch(`${API}/players/${key}`).then(r => r.json())
export const getH2H          = (k1: string, k2: string) => fetch(`${API}/players/${k1}/h2h/${k2}`).then(r => r.json())
export const sendTestPush    = () => fetch(`${API}/push/test`, { method: 'POST' }).then(r => r.json())
