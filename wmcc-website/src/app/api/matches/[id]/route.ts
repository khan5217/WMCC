import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: { team: true },
  })
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(match)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async () => {
    const body = await req.json()

    // Whitelist updatable fields
    const allowed = [
      'isLive', 'liveScore',
      'opposition', 'venue', 'isHome', 'date', 'format', 'leagueName',
      'result', 'wmccScore', 'wmccOvers', 'oppositionScore', 'oppositionOvers',
      'topScorer', 'topScorerRuns', 'topBowler', 'topBowlerWickets',
      'cricheroesUrl', 'description', 'isFeatured',
    ]
    const data: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) data[key] = body[key]
    }

    const match = await prisma.match.update({ where: { id: params.id }, data })
    return NextResponse.json(match)
  }, 'COMMITTEE')
}
