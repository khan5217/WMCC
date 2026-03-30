import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      team: true,
      event: { select: { id: true, name: true, date: true, venue: true } },
    },
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(_req, async () => {
    const match = await prisma.match.findUnique({ where: { id: params.id } })
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Unlink gallery items before deletion (matchId is nullable)
    await prisma.galleryItem.updateMany({ where: { matchId: params.id }, data: { matchId: null } })
    await prisma.match.delete({ where: { id: params.id } })

    // If the event now has no remaining matches, delete it too
    const remainingMatches = await prisma.match.count({ where: { eventId: match.eventId } })
    if (remainingMatches === 0) {
      await prisma.matchEvent.delete({ where: { id: match.eventId } })
    }

    return NextResponse.json({ success: true })
  }, 'COMMITTEE')
}
