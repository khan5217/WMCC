import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

interface Ctx { params: { id: string } }

export async function GET(req: NextRequest, { params }: Ctx) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const match = await prisma.match.findUnique({ where: { id: params.id } })
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Day boundaries for same-day fee lookup
    const dayStart = new Date(match.date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(match.date)
    dayEnd.setHours(23, 59, 59, 999)

    const requests = await prisma.availabilityRequest.findMany({
      where: { matchId: params.id },
      include: {
        player: {
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            matchFeeAssignments: {
              where: { matchId: params.id },
              select: { id: true, status: true, amount: true, playerType: true, matchId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // For each available player, also check if they have a fee on another match same day
    const enriched = await Promise.all(requests.map(async (r) => {
      let dayFee = r.player.matchFeeAssignments[0] ?? null
      let dayFeeMatchId: string | null = dayFee?.matchId ?? null

      if (!dayFee && r.status === 'AVAILABLE') {
        const sameDayFee = await prisma.matchFeeAssignment.findFirst({
          where: {
            playerId: r.playerId,
            match: { date: { gte: dayStart, lte: dayEnd } },
          },
          include: {
            match: { select: { id: true, opposition: true } },
          },
        })
        if (sameDayFee) {
          dayFee = {
            id: sameDayFee.id,
            status: sameDayFee.status,
            amount: sameDayFee.amount,
            playerType: sameDayFee.playerType,
            matchId: sameDayFee.matchId,
          }
          dayFeeMatchId = sameDayFee.matchId
        }
      }

      return {
        ...r,
        dayFee,
        dayFeeOnDifferentMatch: dayFeeMatchId !== null && dayFeeMatchId !== params.id,
        dayFeeMatchId,
      }
    }))

    const summary = {
      available:   requests.filter(r => r.status === 'AVAILABLE').length,
      unavailable: requests.filter(r => r.status === 'UNAVAILABLE').length,
      maybe:       requests.filter(r => r.status === 'MAYBE').length,
      pending:     requests.filter(r => r.status === 'PENDING').length,
      total:       requests.length,
    }

    return NextResponse.json({ requests: enriched, summary })
  })
}
