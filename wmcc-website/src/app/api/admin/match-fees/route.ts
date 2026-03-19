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

  // Get all matches in the season that have at least one fee assignment
  const matchesWithFees = await prisma.match.findMany({
    where: {
      matchFeeAssignments: { some: {} },
      date: {
        gte: new Date(`${season}-01-01`),
        lte: new Date(`${season}-12-31`),
      },
    },
    include: {
      team: { select: { name: true, type: true } },
      matchFeeAssignments: {
        select: { status: true, amount: true },
      },
    },
    orderBy: { date: 'desc' },
  })

  const matches = matchesWithFees.map((m) => {
    const paid = m.matchFeeAssignments.filter((a) => a.status === 'PAID').length
    const outstanding = m.matchFeeAssignments.filter((a) => a.status === 'OUTSTANDING').length
    const pending = m.matchFeeAssignments.filter((a) => a.status === 'PENDING').length
    const waived = m.matchFeeAssignments.filter((a) => a.status === 'WAIVED').length
    const collected = m.matchFeeAssignments.filter((a) => a.status === 'PAID').reduce((s, a) => s + a.amount, 0)
    const expected = m.matchFeeAssignments.filter((a) => a.status !== 'WAIVED').reduce((s, a) => s + a.amount, 0)

    return {
      matchId: m.id,
      opposition: m.opposition,
      date: m.date,
      venue: m.venue,
      teamName: m.team.name,
      total: m.matchFeeAssignments.length,
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
