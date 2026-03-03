import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, async () => {
    const body = await req.json()

    const allowed = [
      'totalMatches', 'totalRuns', 'highestScore', 'battingAvg', 'strikeRate',
      'totalWickets', 'bestBowling', 'bowlingAvg', 'economy', 'cricheroesUrl',
      'jerseyNumber', 'role', 'battingStyle', 'bowlingStyle', 'bio', 'nationality', 'isActive',
    ]
    const data: Record<string, any> = {}
    for (const key of allowed) {
      if (key in body) data[key] = body[key]
    }

    const player = await prisma.player.update({ where: { id: params.id }, data })
    return NextResponse.json(player)
  }, 'COMMITTEE')
}
