// Comprehensive player name to country mapping
export const playerCountries: Record<string, string> = {
  // Top players
  'Jannik Sinner': 'ITA',
  'Novak Djokovic': 'SRB',
  'Carlos Alcaraz': 'ESP',
  'Daniil Medvedev': 'RUS',
  'Holger Rune': 'DEN',
  'Stefanos Tsitsipas': 'GRE',
  'Taylor Fritz': 'USA',
  'Alexander Zverev': 'GER',
  'Tommy Paul': 'USA',
  'Grigor Dimitrov': 'BUL',

  // Women's top players
  'Iga Swiatek': 'POL',
  'Aryna Sabalenka': 'KAZ',
  'Coco Gauff': 'USA',
  'Emma Raducanu': 'GBR',
  'Marketa Vondrousova': 'CZE',
  'Madison Keys': 'USA',
  'Elena Rybakina': 'KAZ',
  'Danielle Collins': 'USA',

  // Additional notable players
  'Roger Federer': 'SUI',
  'Rafael Nadal': 'ESP',
  'Andy Murray': 'GBR',
  'Juan Martin del Potro': 'ARG',
  'Stan Wawrinka': 'SUI',
  'Dominic Thiem': 'AUT',
  'David Goffin': 'BEL',
  'Roberto Bautista Agut': 'ESP',
  'Matteo Berrettini': 'ITA',
  'Gael Monfils': 'FRA',
  'Fabio Fognini': 'ITA',
  'Diego Schwartzman': 'ARG',
  'Cameron Norrie': 'GBR',
  'Sebastian Korda': 'USA',
  'Frances Tiafoe': 'USA',
  'Brandon Nakashima': 'USA',
  'Felix Auger-Aliassime': 'CAN',
  'Denis Shapovalov': 'CAN',
  'Pablo Carreno Busta': 'ESP',
  'Cristian Garin': 'CHI',

  // Women's additional
  'Serena Williams': 'USA',
  'Venus Williams': 'USA',
  'Naomi Osaka': 'JPN',
  'Simona Halep': 'ROU',
  'Ashleigh Barty': 'AUS',
  'Bianca Andreescu': 'CAN',
  'Sofia Kenin': 'USA',
  'Jessica Pegula': 'USA',
  'Daria Kasatkina': 'RUS',
  'Victoria Azarenka': 'BLR',
  'Petra Kvitova': 'CZE',
  'Karolina Pliskova': 'CZE',
  'Garbine Muguruza': 'ESP',
  'Sloane Stephens': 'USA',
  'Veronika Kudermetova': 'RUS',
  'Anett Kontaveit': 'EST',
}

export function getPlayerCountry(playerName: string): string | null {
  return playerCountries[playerName] || null
}
