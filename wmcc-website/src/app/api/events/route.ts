import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

// GET /api/events?date=YYYY-MM-DD&teamId=XXX
// Returns existing MatchEvents on a given date for a team (used when creating a festival match)
export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const { searchParams } = new URL(req.url)
    const date   = searchParams.get('date')
    const teamId = searchParams.get('teamId')

    if (!date || !teamId) {
      return NextResponse.json({ error: 'date and teamId required' }, { status: 400 })
    }

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const events = await prisma.matchEvent.findMany({
      where: {
        teamId,
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        matches: { select: { id: true, opposition: true }, orderBy: { date: 'asc' } },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json(events)
  }, 'COMMITTEE')
}
