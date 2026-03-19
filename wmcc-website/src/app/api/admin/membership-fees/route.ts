import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const TIER_AMOUNTS: Record<string, number> = {
  PLAYING_SENIOR: 4000,
  PLAYING_JUNIOR: 2000,
  SOCIAL: 500,
  FAMILY: 6000,
  LIFE: 0,
}

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const season = Number(req.nextUrl.searchParams.get('season')) || new Date().getFullYear()

    const users = await prisma.user.findMany({
      orderBy: { firstName: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        membershipTier: true,
        createdAt: true,
        memberships: {
          where: { season },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    const data = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      membershipTier: u.membershipTier,
      createdAt: u.createdAt,
      amountDue: TIER_AMOUNTS[u.membershipTier ?? ''] ?? 4000,
      membership: u.memberships[0] ?? null,
    }))

    const paid = data.filter((m) => m.membership?.status === 'PAID').length
    const unpaid = data.length - paid
    const revenue = data
      .filter((m) => m.membership?.status === 'PAID')
      .reduce((sum, m) => sum + (m.membership?.amount ?? 0), 0)

    return NextResponse.json({ season, members: data, stats: { total: data.length, paid, unpaid, revenue } })
  }, 'COMMITTEE')
}
