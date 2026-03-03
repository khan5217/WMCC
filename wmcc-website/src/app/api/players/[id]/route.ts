import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const player = await prisma.player.findUnique({
    where: { id: params.id },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  })
  if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(player)
}

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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(_req, async () => {
    const player = await prisma.player.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, email: true } } },
    })
    if (!player) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Unset captain on any teams this player captains
    await prisma.team.updateMany({ where: { captainId: params.id }, data: { captainId: null } })
    await prisma.player.delete({ where: { id: params.id } })

    // Delete placeholder user accounts (squad players without a real account)
    if (player.user.email.endsWith('@wmcc.internal')) {
      await prisma.user.delete({ where: { id: player.user.id } })
    }

    return NextResponse.json({ success: true })
  }, 'COMMITTEE')
}
