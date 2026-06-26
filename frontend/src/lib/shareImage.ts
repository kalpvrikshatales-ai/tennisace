'use client'

interface ShareData {
  player1: string
  player2: string
  score: string
  tournament?: string
  status?: string
  gameScore?: string
}

export async function shareScoreImage(data: ShareData): Promise<void> {
  const canvas = document.createElement('canvas')
  const W = 800, H = 420
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // Top accent bar
  const grad = ctx.createLinearGradient(0, 0, W, 0)
  grad.addColorStop(0, '#00C875')
  grad.addColorStop(1, '#009A58')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, 6)

  // Bottom accent bar
  ctx.fillStyle = '#F8FAFC'
  ctx.fillRect(0, H - 50, W, 50)

  // TennisAce logo text
  ctx.font = 'bold 18px -apple-system, Inter, sans-serif'
  ctx.fillStyle = '#0F172A'
  ctx.fillText('Tennis', 36, 44)
  ctx.fillStyle = '#00C875'
  ctx.fillText('Ace', 36 + ctx.measureText('Tennis').width, 44)

  // Live badge
  if (data.status === 'In Progress' || data.status === '1') {
    ctx.fillStyle = '#DCFCE7'
    roundRect(ctx, W - 120, 26, 84, 28, 14)
    ctx.fillStyle = '#00C875'
    ctx.font = 'bold 11px -apple-system, Inter, sans-serif'
    ctx.fillText('● LIVE', W - 108, 45)
  }

  // Tournament name
  if (data.tournament) {
    ctx.font = '13px -apple-system, Inter, sans-serif'
    ctx.fillStyle = '#94A3B8'
    ctx.fillText(data.tournament.toUpperCase(), 36, 80)
  }

  // Score parsing
  const sets = data.score ? data.score.split(',').map(s => s.trim()) : []

  // Player 1
  drawPlayer(ctx, data.player1, sets, 0, 140, W, true)

  // Divider
  ctx.fillStyle = '#E2E8F0'
  ctx.fillRect(36, 200, W - 72, 1)

  // Player 2
  drawPlayer(ctx, data.player2, sets, 1, 230, W, false)

  // Game score
  if (data.gameScore) {
    const parts = data.gameScore.split('-')
    ctx.font = 'bold 13px -apple-system, Inter, sans-serif'
    ctx.fillStyle = '#00C875'
    ctx.textAlign = 'center'
    ctx.fillText(data.gameScore, W / 2, 290)
    ctx.textAlign = 'left'
  }

  // Footer
  ctx.font = '12px -apple-system, Inter, sans-serif'
  ctx.fillStyle = '#CBD5E1'
  ctx.textAlign = 'center'
  ctx.fillText('tennisace.live · Feel every match. Live.', W / 2, H - 18)
  ctx.textAlign = 'left'

  // Convert to blob and share
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { reject(new Error('Canvas failed')); return }
      const file = new File([blob], 'tennisace-score.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${data.player1} vs ${data.player2}`,
          text: `🎾 ${data.player1} vs ${data.player2} — ${data.score} | tennisace.live`,
        })
      } else if (navigator.share) {
        await navigator.share({
          title: `${data.player1} vs ${data.player2}`,
          text: `🎾 ${data.player1} vs ${data.player2} — ${data.score} | tennisace.live`,
          url: 'https://tennisace.live',
        })
      } else {
        // Download as fallback
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'tennisace-score.png'; a.click()
        URL.revokeObjectURL(url)
      }
      resolve()
    }, 'image/png')
  })
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  name: string,
  sets: string[],
  playerIdx: number,
  y: number,
  W: number,
  isLeading: boolean
) {
  // Name
  ctx.font = `${isLeading ? 'bold' : '500'} 22px -apple-system, Inter, sans-serif`
  ctx.fillStyle = isLeading ? '#0F172A' : '#64748B'
  const shortName = name.length > 20 ? name.split(' ').pop()! : name
  ctx.fillText(shortName, 36, y)

  // Set scores
  const startX = W - 36
  const scores = sets.map(s => {
    const parts = s.split('-')
    return playerIdx === 0 ? (parts[0] ?? '') : (parts[1] ?? '')
  }).reverse()

  scores.forEach((s, i) => {
    ctx.font = 'bold 26px -apple-system, Inter, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillStyle = isLeading ? '#0F172A' : '#94A3B8'
    ctx.fillText(s, startX - i * 44, y)
    ctx.textAlign = 'left'
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
  ctx.fill()
}
