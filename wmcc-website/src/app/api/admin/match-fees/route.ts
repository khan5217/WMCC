import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

function getAuth(req: NextRequest) {
  const token = req.cookies.get('wmcc_session')?.value
  return token ? verifyToken(token) : null
}

export async function GET(req: NextRequest) {
  const payload = getAuth(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const season = searchParams.get('season') ? parseInt(searchParams.get('season')!) : new Date().getFullYear()

  // Get all events in the season that have at least one fee assignment
  const eventsWithFees = await prisma.matchEvent.findMany({
    where: {
      matchFeeAssignments: { some: {} },
      season,
    },
    include: {
      team: { select: { name: true, type: true } },
      matches: { select: { id: true }, orderBy: { date: 'asc' }, take: 1 },
      matchFeeAssignments: {
        select: { status: true, amount: true },
      },
    },
    orderBy: { date: 'desc' },
  })

  const matches = eventsWithFees.map((ev) => {
    const paid = ev.matchFeeAssignments.filter((a) => a.status === 'PAID').length
    const outstanding = ev.matchFeeAssignments.filter((a) => a.status === 'OUTSTANDING').length
    const pending = ev.matchFeeAssignments.filter((a) => a.status === 'PENDING').length
    const waived = ev.matchFeeAssignments.filter((a) => a.status === 'WAIVED').length
    const collected = ev.matchFeeAssignments.filter((a) => a.status === 'PAID').reduce((s, a) => s + a.amount, 0)
    const expected = ev.matchFeeAssignments.filter((a) => a.status !== 'WAIVED').reduce((s, a) => s + a.amount, 0)
    // Use first match ID for navigation (URL stays as /admin/match-fees/[matchId])
    const matchId = ev.matches[0]?.id ?? ev.id

    return {
      matchId,
      opposition: ev.name,
      date: ev.date,
      venue: ev.venue,
      teamName: ev.team.name,
      total: ev.matchFeeAssignments.length,
      paid,
      outstanding,
      pending,
      waived,
      collected,
      expected,
    }
  })

  return NextResponse.json({ matches })
}
