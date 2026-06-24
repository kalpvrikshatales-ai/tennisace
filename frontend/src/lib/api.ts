const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
export const getLiveMatches = () => fetch(`${API}/matches/live`).then(r => r.json())
export const getTournaments = () => fetch(`${API}/tournaments/`).then(r => r.json())
