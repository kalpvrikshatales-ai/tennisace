const countryToFlag: Record<string, string> = {
  'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Serbia': '🇷🇸', 'Germany': '🇩🇪',
  'Russia': '🇷🇺', 'Poland': '🇵🇱', 'Belarus': '🇧🇾', 'USA': '🇺🇸',
  'United States': '🇺🇸', 'Kazakhstan': '🇰🇿', 'Czech Republic': '🇨🇿',
  'Australia': '🇦🇺', 'France': '🇫🇷', 'UK': '🇬🇧', 'Great Britain': '🇬🇧',
  'Switzerland': '🇨🇭', 'Greece': '🇬🇷', 'Norway': '🇳🇴', 'Denmark': '🇩🇰',
  'Sweden': '🇸🇪', 'Finland': '🇫🇮', 'Netherlands': '🇳🇱', 'Belgium': '🇧🇪',
  'Austria': '🇦🇹', 'Argentina': '🇦🇷', 'Brazil': '🇧🇷', 'Canada': '🇨🇦',
  'Japan': '🇯🇵', 'China': '🇨🇳', 'South Korea': '🇰🇷', 'Romania': '🇷🇴',
  'Croatia': '🇭🇷', 'Slovakia': '🇸🇰', 'Hungary': '🇭🇺', 'Bulgaria': '🇧🇬',
  'Portugal': '🇵🇹', 'Ukraine': '🇺🇦', 'Latvia': '🇱🇻', 'Estonia': '🇪🇪',
  'Lithuania': '🇱🇹', 'Slovenia': '🇸🇮', 'Tunisia': '🇹🇳', 'Morocco': '🇲🇦',
  'South Africa': '🇿🇦', 'Egypt': '🇪🇬', 'India': '🇮🇳', 'Thailand': '🇹🇭',
  'Taiwan': '🇹🇼', 'Indonesia': '🇮🇩', 'Mexico': '🇲🇽', 'Colombia': '🇨🇴',
  'Chile': '🇨🇱', 'Uruguay': '🇺🇾', 'Ecuador': '🇪🇨', 'Peru': '🇵🇪',
  'New Zealand': '🇳🇿', 'Israel': '🇮🇱', 'Turkey': '🇹🇷', 'Georgia': '🇬🇪',
  'Azerbaijan': '🇦🇿', 'Armenia': '🇦🇲', 'Uzbekistan': '🇺🇿', 'World': '🌍',
}

export function getFlag(country?: string): string {
  if (!country) return ''
  return countryToFlag[country] ?? ''
}
