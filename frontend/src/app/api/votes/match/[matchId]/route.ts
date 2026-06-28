import { NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const browserId = searchParams.get('browser_id')
    const queryString = browserId ? `?browser_id=${browserId}` : ''

    const response = await fetch(`${API}/votes/match/${params.matchId}${queryString}`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to load votes' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
