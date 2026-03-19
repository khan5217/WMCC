import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'
import { sendMembershipReminderEmail } from '@/lib/email'

const TIER_AMOUNTS: Record<string, number> = {
  PLAYING_SENIOR: 4000,
  PLAYING_JUNIOR: 2000,
  SOCIAL: 500,
  FAMILY: 6000,
  LIFE: 0,
}

function formatAmount(pence: number) {
  return `£${(pence / 100).toFixed(2)}`
}

export async function POST(req: NextRequest) {
  return withAuth(req, async () => {
    const { season, userIds, daysRegistered = 0 } = await req.json()

    if (!season) return NextResponse.json({ error: 'season is required' }, { status: 400 })

    // Build the list of users to remind
    let users
    if (Array.isArray(userIds) && userIds.length > 0) {
      users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, email: true, membershipTier: true, createdAt: true },
      })
    } else {
      // All unpaid for the season (no PAID membership record)
      const paidUserIds = await prisma.membership
        .findMany({ where: { season, status: 'PAID' }, select: { userId: true } })
        .then((rows) => rows.map((r) => r.userId))

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - daysRegistered)

      users = await prisma.user.findMany({
        where: {
          id: { notIn: paidUserIds },
          createdAt: { lte: cutoff },
        },
        select: { id: true, firstName: true, email: true, membershipTier: true, createdAt: true },
      })
    }

    let sent = 0
    let failed = 0
    for (const user of users) {
      const amount = formatAmount(TIER_AMOUNTS[user.membershipTier ?? ''] ?? 4000)
      try {
        await sendMembershipReminderEmail(user.email, user.firstName, season, amount)
        sent++
      } catch {
        failed++
      }
    }

    return NextResponse.json({ sent, failed, total: users.length })
  }, 'COMMITTEE')
}
