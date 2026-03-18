import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/api-auth'

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  return withAuth(req, async () => {
    const { season, status, paymentChannel, amount, notes } = await req.json()

    if (!season || !status) {
      return NextResponse.json({ error: 'season and status are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { membershipTier: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Upsert membership record for this user + season
    const existing = await prisma.membership.findFirst({
      where: { userId: params.userId, season },
    })

    const data = {
      tier: user.membershipTier,
      status,
      amount: amount ?? 4000,
      paymentChannel: paymentChannel ?? null,
      notes: notes ?? null,
      paidAt: status === 'PAID' ? new Date() : null,
    }

    let membership
    if (existing) {
      membership = await prisma.membership.update({ where: { id: existing.id }, data })
    } else {
      membership = await prisma.membership.create({
        data: { ...data, userId: params.userId, season },
      })
    }

    // Keep User.membershipStatus in sync
    await prisma.user.update({
      where: { id: params.userId },
      data: { membershipStatus: status === 'PAID' ? 'ACTIVE' : 'PENDING' },
    })

    return NextResponse.json(membership)
  }, 'COMMITTEE')
}
