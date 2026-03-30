import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

interface Ctx { params: { id: string } }

export async function GET(req: NextRequest, { params }: Ctx) {
  return withAuth(req, async (ctx) => {
    if (ctx.role !== 'ADMIN' && ctx.role !== 'COMMITTEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: { event: true },
    })
    if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const requests = await prisma.availabilityRequest.findMany({
      where: { eventId: match.eventId },
      include: {
        player: {
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            matchFeeAssignments: {
              where: { eventId: match.eventId },
              select: { id: true, status: true, amount: true, playerType: true, eventId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const summary = {
      available:   requests.filter(r => r.status === 'AVAILABLE').length,
      unavailable: requests.filter(r => r.status === 'UNAVAILABLE').length,
      maybe:       requests.filter(r => r.status === 'MAYBE').length,
      pending:     requests.filter(r => r.status === 'PENDING').length,
      total:       requests.length,
    }

    return NextResponse.json({ requests, summary, eventId: match.eventId })
  })
}
